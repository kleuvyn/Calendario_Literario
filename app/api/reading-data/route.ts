import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const year = Number(searchParams.get("year"));

  if (!email || !year) return NextResponse.json({ data: [], userGoal: 12 });

  try {
    const query = `
      SELECT rd.*, 
             br.rating, 
             br.cover_url,
             br.genre,
             br.review,
             COALESCE(br.total_pages, rd.total_pages, 0) as total_pages
      FROM public.reading_data rd
      LEFT JOIN public.users u ON u.email = rd.email
      LEFT JOIN public.book_reviews br ON (u.id = br.user_id AND rd.book_name = br.title)
      WHERE rd.email = $1 AND rd.year = $2
      ORDER BY rd.month ASC, rd.status DESC
    `;
    
    const rows = await executeQuery(query, [email, year]);
    
    const userRow = await executeQuery(`SELECT literary_goal FROM public.users WHERE email = $1`, [email]);
    const userGoal = userRow && userRow.length > 0 ? (userRow[0].literary_goal || 12) : 12;

    const cleanRows = rows.map((b: any) => ({
      ...b,
      rating: Number(b.rating) || 0,
      total_pages: Number(b.total_pages) || 0,
      month: Number(b.month),
      status: b.status || 'lendo' 
    }));

    return NextResponse.json({ data: cleanRows, userGoal });
  } catch (error: any) {
    console.error("Erro na API GET:", error);
    return NextResponse.json({ data: [], userGoal: 12 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, bookName, oldBookName, action, rating, coverUrl, 
      totalPages, review, genre, year, month, 
      startDate, endDate, goal 
    } = body;
    
    if (action === "SET_GOAL") {
      await executeQuery(`
        INSERT INTO public.users (email, literary_goal)
        VALUES ($1, $2)
        ON CONFLICT (email) 
        DO UPDATE SET literary_goal = EXCLUDED.literary_goal
      `, [email, Number(goal)]);
      return NextResponse.json({ success: true });
    }

    const pages = Number(totalPages) || 0;

    if (action === "EDIT_READING") {
      await executeQuery(
        `UPDATE public.reading_data SET book_name = $1 
         WHERE email = $2 AND book_name = $3`,
        [bookName, email, oldBookName]
      );
      
      const userRes = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
      if (userRes.length > 0) {
        await executeQuery(
          `UPDATE public.book_reviews SET title = $1 
           WHERE user_id = $2 AND title = $3`,
          [bookName, userRes[0].id, oldBookName]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "DELETE_READING") {
      await executeQuery(
        `DELETE FROM public.reading_data WHERE email = $1 AND book_name = $2`,
        [email, bookName]
      );
      const userRes = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
      if (userRes.length > 0) {
        await executeQuery(
          `DELETE FROM public.book_reviews WHERE user_id = $1 AND title = $2`,
          [userRes[0].id, bookName]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "START_READING") {
      await executeQuery(`
        INSERT INTO public.reading_data (email, book_name, start_date, status, year, month)
        VALUES ($1, $2, $3, 'lendo', $4, $5)
        ON CONFLICT DO NOTHING
      `, [email, bookName, startDate, year, month]);
      return NextResponse.json({ success: true });
    }

    // --- CORREÇÃO AQUI: FINISH_READING ---
    if (action === "FINISH_READING") {
      // Removemos a trava 'AND status = lendo' para garantir que o clique no calendário 
      // sempre consiga sobrescrever ou definir a data final.
      await executeQuery(
        `UPDATE public.reading_data 
         SET end_date = $1, status = 'lido' 
         WHERE email = $2 AND book_name = $3`,
        [endDate, email, bookName]
      );
      return NextResponse.json({ success: true });
    }

    if (action === "UPDATE_REVIEW") {
      const userRes = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
      if (userRes.length === 0) return NextResponse.json({ error: "Usuário não encontrado" });
      const userId = userRes[0].id;

      const targetName = oldBookName || bookName;

      await executeQuery(
        `UPDATE public.reading_data 
         SET book_name = $1, total_pages = $2 
         WHERE email = $3 AND book_name = $4`,
        [bookName, pages, email, targetName]
      );

      if (oldBookName && oldBookName !== bookName) {
        await executeQuery(
          `UPDATE public.book_reviews 
           SET title = $1 
           WHERE user_id = $2 AND title = $3`,
          [bookName, userId, oldBookName]
        );
      }

      await executeQuery(`
        INSERT INTO public.book_reviews (user_id, title, rating, cover_url, total_pages, genre, review, year, month)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, title) DO UPDATE SET 
          rating = EXCLUDED.rating, 
          cover_url = EXCLUDED.cover_url, 
          total_pages = EXCLUDED.total_pages,
          genre = EXCLUDED.genre,
          review = EXCLUDED.review
      `, [userId, bookName, rating, coverUrl, pages, genre, review, year, month]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}