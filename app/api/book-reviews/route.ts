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
      `SELECT br.* FROM public.book_reviews br
       JOIN public.users u ON u.id = br.user_id
       WHERE u.email = $1 
       ORDER BY br.created_at DESC`,
      [email]
    )

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, title, rating, cover_url, total_pages, year, month } = body

    if (!email || !title) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const userResult = await executeQuery("SELECT id FROM public.users WHERE email = $1", [email])
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const userId = userResult[0].id

    await executeQuery(
      `INSERT INTO public.book_reviews (user_id, title, rating, cover_url, total_pages, year, month)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, title) 
       DO UPDATE SET 
         rating = EXCLUDED.rating, 
         cover_url = EXCLUDED.cover_url, 
         total_pages = EXCLUDED.total_pages,
         year = EXCLUDED.year,
         month = EXCLUDED.month`,
      [userId, title, rating || 0, cover_url || "", total_pages || 0, year, month]
    )

    await executeQuery(
      `UPDATE public.reading_data 
       SET total_pages = $1, status = 'finalizado', finish_month = $2
       WHERE email = $3 AND book_name = $4 AND year = $5`,
      [total_pages || 0, month, email, title, year]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao salvar review" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }

    await executeQuery(
      "DELETE FROM public.book_reviews WHERE id = $1",
      [id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar review" }, { status: 500 })
  }
}