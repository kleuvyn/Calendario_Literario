import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const year = Number(searchParams.get("year"));

  if (!email) return NextResponse.json({ data: [] });

  try {
    const query = `
      SELECT rd.*, br.rating, br.cover_url, br.month as finish_month, br.year as finish_year,
             COALESCE(br.total_pages, rd.total_pages) as display_pages
      FROM public.reading_data rd
      LEFT JOIN public.book_reviews br ON rd.user_id = br.user_id AND rd.book_name = br.title
      WHERE rd.email = $1 AND (rd.year = $2 OR br.year = $2)
      ORDER BY rd.start_date ASC
    `;
    const rows = await executeQuery(query, [email, year]);
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, bookName, startDate, endDate, year, month, action, rating, coverUrl, totalPages } = body;
    const pages = Number(totalPages) || 0;

    const userResult = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
    if (userResult.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const userId = userResult[0].id;

    if (action === "START_READING") {
      // SALVA NA TABELA BOOKS (CATALOGO)
      await executeQuery(`
        INSERT INTO public.books (title) 
        VALUES ($1) 
        ON CONFLICT DO NOTHING
      `, [bookName]);

      // SALVA NA TABELA READING_DATA
      await executeQuery(`
        INSERT INTO public.reading_data (email, user_id, book_name, start_date, year, month, status, total_pages)
        VALUES ($1, $2, $3, $4, $5, $6, 'lendo', 0)
      `, [email, userId, bookName, startDate, year, month]);
    } 
    
    else if (action === "FINISH_READING") {
      await executeQuery(`
        UPDATE public.reading_data 
        SET end_date = $1, status = 'finalizado', total_pages = $2
        WHERE email = $3 AND book_name = $4 AND status = 'lendo'
      `, [endDate, pages, email, bookName]);

      await executeQuery(`
        INSERT INTO public.book_reviews (user_id, year, month, title, rating, cover_url, total_pages)
        VALUES ($1, $2, $3, $4, 0, '', $5)
        ON CONFLICT (user_id, title) DO UPDATE SET 
          year = EXCLUDED.year, 
          month = EXCLUDED.month,
          total_pages = EXCLUDED.total_pages
      `, [userId, year, month, bookName, pages]);
    }

    else if (action === "UPDATE_REVIEW") {
      await executeQuery(`
        INSERT INTO public.book_reviews (user_id, year, month, title, rating, cover_url, total_pages)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, title) DO UPDATE SET 
          rating = EXCLUDED.rating, 
          cover_url = EXCLUDED.cover_url, 
          total_pages = EXCLUDED.total_pages
      `, [userId, year, month, bookName, rating, coverUrl, pages]);

      await executeQuery(`
        UPDATE public.reading_data 
        SET total_pages = $1
        WHERE user_id = $2 AND book_name = $3
      `, [pages, userId, bookName]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}