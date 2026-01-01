import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const year = Number(searchParams.get("year"));
  const isRetrospective = searchParams.get("isRetrospective") === "true";

  if (!email || !year) return NextResponse.json({ data: [], userGoal: 12 });

  try {
    const query = isRetrospective 
      ? `
      SELECT rd.*, br.rating, br.cover_url, br.genre, br.review,
             COALESCE(br.total_pages, rd.total_pages, 0) as total_pages
      FROM public.reading_data rd
      LEFT JOIN public.users u ON u.email = rd.email
      LEFT JOIN public.book_reviews br ON (u.id = br.user_id AND rd.book_name = br.title)
      WHERE rd.email = $1 AND rd.year = $2
      ORDER BY rd.month ASC, rd.status DESC
    `
      : `
      SELECT rd.*, br.rating, br.cover_url, br.genre, br.review,
             COALESCE(br.total_pages, rd.total_pages, 0) as total_pages
      FROM public.reading_data rd
      LEFT JOIN public.users u ON u.email = rd.email
      LEFT JOIN public.book_reviews br ON (u.id = br.user_id AND rd.book_name = br.title)
      WHERE rd.email = $1 AND (rd.year = $2 OR rd.status = 'lendo')
      ORDER BY rd.month ASC, rd.status DESC
    `;
    
    const rows = await executeQuery(query, [email, year]);
    
    const userRow = await executeQuery(`SELECT literary_goal, goals_by_year FROM public.users WHERE email = $1`, [email]);
    let userGoal = 12;

    if (userRow && userRow.length > 0) {
      const goalsJson = userRow[0].goals_by_year;
      const globalGoal = userRow[0].literary_goal || 12;
      
      if (goalsJson) {
        const goals = typeof goalsJson === 'string' ? JSON.parse(goalsJson) : goalsJson;
        userGoal = goals[year.toString()] || globalGoal;
      } else {
        userGoal = globalGoal;
      }
    }

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
      await executeQuery(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS goals_by_year JSONB DEFAULT '{}'::jsonb`, []);
      
      const userRes = await executeQuery(`SELECT goals_by_year FROM public.users WHERE email = $1`, [email]);
      let currentGoals = {};
      
      if (userRes.length > 0 && userRes[0].goals_by_year) {
        currentGoals = typeof userRes[0].goals_by_year === 'string' 
          ? JSON.parse(userRes[0].goals_by_year) 
          : userRes[0].goals_by_year;
      }

      const updatedGoals = { ...currentGoals, [year.toString()]: Number(goal) };

      await executeQuery(
        `UPDATE public.users SET goals_by_year = $1 WHERE email = $2`,
        [JSON.stringify(updatedGoals), email]
      );
      return NextResponse.json({ success: true });
    }

    const pages = Number(totalPages) || 0;

    if (action === "EDIT_READING") {
      await executeQuery(
        `UPDATE public.reading_data SET book_name = $1 WHERE email = $2 AND book_name = $3`,
        [bookName, email, oldBookName]
      );
      const userRes = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
      if (userRes.length > 0) {
        await executeQuery(
          `UPDATE public.book_reviews SET title = $1 WHERE user_id = $2 AND title = $3`,
          [bookName, userRes[0].id, oldBookName]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "DELETE_READING") {
      await executeQuery(`DELETE FROM public.reading_data WHERE email = $1 AND book_name = $2`, [email, bookName]);
      const userRes = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
      if (userRes.length > 0) {
        await executeQuery(`DELETE FROM public.book_reviews WHERE user_id = $1 AND title = $2`, [userRes[0].id, bookName]);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "START_READING") {
      await executeQuery(`DELETE FROM public.reading_data WHERE email = $1 AND book_name = $2`, [email, bookName]);
      await executeQuery(`
        INSERT INTO public.reading_data (email, book_name, start_date, status, year, month, cover_url, total_pages)
        VALUES ($1, $2, $3, 'lendo', $4, $5, $6, $7)
      `, [email, bookName, startDate, year, month, coverUrl, pages]);
      return NextResponse.json({ success: true });
    }

    if (action === "FINISH_READING") {
      await executeQuery(
        `UPDATE public.reading_data SET end_date = $1, status = 'lido' WHERE email = $2 AND book_name = $3`,
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
        `UPDATE public.reading_data SET book_name = $1, total_pages = $2, cover_url = $3 
         WHERE email = $4 AND book_name = $5`,
        [bookName, pages, coverUrl, email, targetName]
      );

      await executeQuery(`DELETE FROM public.book_reviews WHERE user_id = $1 AND title = $2`, [userId, bookName]);
      await executeQuery(`
        INSERT INTO public.book_reviews (user_id, title, rating, cover_url, total_pages, genre, review, year, month)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [userId, bookName, rating, coverUrl, pages, genre, review, year, month]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}