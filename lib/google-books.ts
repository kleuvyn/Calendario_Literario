export interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    publishedDate?: string
    description?: string
    pageCount?: number
    categories?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
  }
}

export interface BookSearchResult {
  title: string
  authors: string
  cover: string
  pages: number
  isbn: string
  description: string
  categories: string[]
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  if (!query || query.length < 2) return []

  try {
    const response = await fetch(
      `/api/google-books?q=${encodeURIComponent(query)}`
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data?.error || 'Erro ao buscar livros')
    }

    const data = await response.json()
    const books: GoogleBook[] = data.items || []

    return books.map((book) => ({
      title: book.volumeInfo.title || 'Título desconhecido',
      authors: book.volumeInfo.authors?.join(', ') || 'Autor desconhecido',
      cover: book.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
      pages: book.volumeInfo.pageCount || 0,
      isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier || '',
      description: book.volumeInfo.description || '',
      categories: book.volumeInfo.categories || [],
    }))
  } catch (error) {
    console.error('Erro Google Books:', error)
    return []
  }
}

export async function getBookByISBN(isbn: string): Promise<BookSearchResult | null> {
  try {
    const response = await fetch(`/api/google-books?isbn=${encodeURIComponent(isbn)}`)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) return null

    const book: GoogleBook = data.items[0]
    
    return {
      title: book.volumeInfo.title || 'Título desconhecido',
      authors: book.volumeInfo.authors?.join(', ') || 'Autor desconhecido',
      cover: book.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
      pages: book.volumeInfo.pageCount || 0,
      isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier || '',
      description: book.volumeInfo.description || '',
      categories: book.volumeInfo.categories || [],
    }
  } catch (error) {
    return null
  }
}
