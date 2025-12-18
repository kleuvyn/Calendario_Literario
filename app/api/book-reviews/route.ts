import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    const data = await executeQuery(
      `SELECT * FROM public.books 
       WHERE user_email = $1 
       ORDER BY created_at DESC`,
      [email]
    )

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar livros" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, title, author, thumbnail, googleBookId, status } = body

    if (!email || !title) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const userResult = await executeQuery("SELECT id FROM public.users WHERE email = $1", [email])

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    await executeQuery(
      `INSERT INTO public.books (user_email, title, author, thumbnail, google_book_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, title || "", author || "", thumbnail || "", googleBookId || "", status || "planejado"]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao salvar livro" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const email = searchParams.get("email")

    if (!id || !email) {
      return NextResponse.json({ error: "ID e Email são obrigatórios" }, { status: 400 })
    }

    await executeQuery(
      "DELETE FROM public.books WHERE id = $1 AND user_email = $2",
      [id, email]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar livro" }, { status: 500 })
  }
}