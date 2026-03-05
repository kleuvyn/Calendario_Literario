import { NextRequest, NextResponse } from "next/server"

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"
const OPEN_LIBRARY_SEARCH_API = "https://openlibrary.org/search.json"

function mapOpenLibraryToGoogleShape(docs: any[]) {
  return docs.slice(0, 10).map((doc: any) => {
    const isbn = Array.isArray(doc.isbn) ? doc.isbn[0] : undefined
    const coverFromIsbn = isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
      : undefined
    const coverFromId = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined

    return {
      id: doc.key || doc.cover_edition_key || doc.title,
      volumeInfo: {
        title: doc.title || "Título desconhecido",
        authors: Array.isArray(doc.author_name) ? doc.author_name : [],
        pageCount: doc.number_of_pages_median || 0,
        categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 3) : [],
        industryIdentifiers: isbn
          ? [{ type: "ISBN_13", identifier: isbn }]
          : [],
        imageLinks: {
          thumbnail: coverFromIsbn || coverFromId || "",
          smallThumbnail: coverFromIsbn || coverFromId || "",
        },
      },
    }
  })
}

async function searchOpenLibrary(searchTerm: string, byIsbn: boolean) {
  const openLibraryUrl = new URL(OPEN_LIBRARY_SEARCH_API)
  if (byIsbn) {
    openLibraryUrl.searchParams.set("isbn", searchTerm.replace(/^isbn:/, ""))
  } else {
    openLibraryUrl.searchParams.set("q", searchTerm)
    openLibraryUrl.searchParams.set("limit", "10")
    openLibraryUrl.searchParams.set("language", "por")
  }

  const openLibraryResponse = await fetch(openLibraryUrl.toString(), {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  })

  if (!openLibraryResponse.ok) {
    throw new Error("OpenLibrary indisponível")
  }

  const openLibraryData = await openLibraryResponse.json().catch(() => ({}))
  const docs = Array.isArray(openLibraryData?.docs) ? openLibraryData.docs : []

  return { items: mapOpenLibraryToGoogleShape(docs) }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim()
  const isbn = searchParams.get("isbn")?.trim()

  if (!query && !isbn) {
    return NextResponse.json(
      { error: "Informe um termo de busca" },
      { status: 400 }
    )
  }

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim()
    const searchTerm = isbn ? `isbn:${isbn}` : query!
    const maxResults = isbn ? 1 : 10

    const url = new URL(GOOGLE_BOOKS_API)
    url.searchParams.set("q", searchTerm)
    url.searchParams.set("maxResults", String(maxResults))
    if (!isbn) {
      url.searchParams.set("langRestrict", "pt")
    }
    if (apiKey) {
      url.searchParams.set("key", apiKey)
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const reason =
        data?.error?.message ||
        data?.error?.errors?.[0]?.message ||
        "Falha na busca de livros"

      if (response.status === 429 || response.status >= 500) {
        const fallbackData = await searchOpenLibrary(searchTerm, Boolean(isbn))
        return NextResponse.json(fallbackData)
      }

      return NextResponse.json(
        { error: `Google Books: ${reason}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ items: data?.items || [] })
  } catch (error) {
    return NextResponse.json(
      { error: "Não foi possível consultar o Google Books" },
      { status: 500 }
    )
  }
}