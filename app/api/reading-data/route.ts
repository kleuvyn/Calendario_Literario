import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const year = Number(searchParams.get("year"));
  const month = searchParams.get("month");

  if (!email) return NextResponse.json({ data: [] });

  try {
    let query = `
      SELECT rd.*, 
             br.rating, 
             br.cover_url, 
             COALESCE(br.total_pages, rd.total_pages) as display_pages
      FROM public.reading_data rd
      LEFT JOIN public.book_reviews br ON rd.user_id = br.user_id AND rd.book_name = br.title
      WHERE (rd.email = $1 OR rd.user_id = (SELECT id FROM public.users WHERE email = $1 LIMIT 1))
      AND rd.year = $2
    `;
    
    const params: any[] = [email, year];

    if (month && !isNaN(Number(month))) {
      query += ` AND rd.month = $3`;
      params.push(Number(month));
    }

    query += ` ORDER BY rd.start_date ASC`;

    const rows = await executeQuery(query, params);
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, bookName, startDate, endDate, year, month, action, rating, coverUrl, totalPages } = body;
    const pages = Number(totalPages) || 0;

    const userResult = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
    if (userResult.length === 0) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    const userId = userResult[0].id;

    if (action === "START_READING") {
      await executeQuery(`
        INSERT INTO public.reading_data (email, user_id, user_email, book_name, start_date, year, month, status, total_pages)
        VALUES ($1, $2, $1, $3, $4, $5, $6, 'lendo', 0)
      `, [email, userId, bookName, startDate, year, month]);
    } 
    
    else if (action === "FINISH_READING") {
      await executeQuery(`
        UPDATE public.reading_data 
        SET end_date = $1, status = 'finalizado', total_pages = $2
        WHERE (email = $3 OR user_id = $5) AND book_name = $4 AND status = 'lendo'
      `, [endDate, pages, email, bookName, userId]);

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
        INSERT INTO public.book_reviews (user_id, title, rating, cover_url, total_pages)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, title) DO UPDATE SET 
          rating = EXCLUDED.rating, 
          cover_url = EXCLUDED.cover_url, 
          total_pages = EXCLUDED.total_pages
      `, [userId, bookName, rating, coverUrl, pages]);

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