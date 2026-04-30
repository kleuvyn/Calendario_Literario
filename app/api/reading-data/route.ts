import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const year = Number(searchParams.get("year"));
  const isRetrospective = searchParams.get("isRetrospective") === "true";
  const includeAllYears = searchParams.get("includeAllYears") === "true";
  const monthParam = Number(searchParams.get("month"));
  const hasMonth = Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12;

  if (!email || !year) {
    return NextResponse.json(
      { data: [], userGoal: 12 },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' } }
    );
  }

  let monthStart = "";
  let monthEnd = "";
  if (hasMonth) {
    const start = new Date(year, monthParam - 1, 1);
    const end = new Date(year, monthParam, 0);
    monthStart = start.toISOString().split("T")[0];
    monthEnd = end.toISOString().split("T")[0];
  }

  try {
    const dateRangeCondition = hasMonth
      ? `AND (
          rd.status IN ('lendo', 'reading', 'planejado', 'planned')
          OR (
            rd.start_date IS NOT NULL
            AND rd.start_date <= $3
            AND (rd.end_date IS NULL OR rd.end_date >= $4)
          )
          OR (
            rd.end_date IS NOT NULL
            AND rd.end_date BETWEEN $4 AND $3
          )
        )`
      : '';

    const yearCondition = hasMonth
      ? `AND (
          rd.year = $2
          OR rd.status IN ('lendo', 'reading')
        )`
      : isRetrospective
        ? includeAllYears
          ? ''
          : `AND rd.year = $2`
        : includeAllYears
          ? ''
          : `AND (rd.year = $2 OR rd.status IN ('lendo', 'reading'))`;

    const query = `
      SELECT rd.*
      FROM public.reading_data rd
      WHERE rd.email = $1 ${yearCondition}
      ${dateRangeCondition}
      ORDER BY rd.month ASC, rd.status DESC
    `;

    const params = hasMonth
      ? [email, String(year), monthEnd, monthStart]
      : includeAllYears
        ? [email]
        : [email, year];
    const rows = await executeQuery(query, params);

    const userRow = await executeQuery(`SELECT literary_goal, goals_by_year FROM public.users WHERE email = $1`, [email]);
    let userGoal = 12;

    if (userRow && userRow.length > 0) {
      const goalsJson = userRow[0].goals_by_year;
      const globalGoal = Number(userRow[0].literary_goal) || 12;
      
      if (goalsJson) {
        const goals = typeof goalsJson === 'string' ? JSON.parse(goalsJson) : goalsJson;
        userGoal = Number(goals?.[year.toString()] ?? globalGoal) || globalGoal;
      } else {
        userGoal = globalGoal;
      }
    }

    const cleanRows = rows.map((b: any) => ({
      ...b,
      rating: Number(b.rating) || 0,
      total_pages: Number(b.total_pages) || 0,
      month: Number(b.month),
      status: b.status || ''
    }));

    return NextResponse.json(
      { data: cleanRows, userGoal },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    );
  } catch (error: any) {
    console.error("Erro na API GET:", error);
    return NextResponse.json(
      { data: [], userGoal: 12 },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      email, bookName, oldBookName, action, rating, coverUrl, 
      totalPages, review, genre, year, month, 
      startDate, endDate, goal, author, pages: bodyPages, notes, cover_url, format, owned
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

    // Usar pages do body ou totalPages como fallback
    const numPages = Number(bodyPages || totalPages) || 0;

    if (action === "EDIT_READING") {
      // Garantir que as colunas existam
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS author_name TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS rating INTEGER`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS notes TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS owned BOOLEAN`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS format TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS genre TEXT`, []);
      
      // Construir query de atualização
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Sempre atualiza o nome do livro
      updates.push(`book_name = $${paramIndex++}`);
      params.push(bookName);

      // Atualiza campos opcionais se fornecidos
      if (author !== undefined) {
        updates.push(`author_name = $${paramIndex++}`);
        params.push(author || null);
      }
      
      if (bodyPages !== undefined) {
        updates.push(`total_pages = $${paramIndex++}`);
        params.push(Number(bodyPages) || 0);
      }
      
      if (rating !== undefined) {
        updates.push(`rating = $${paramIndex++}`);
        params.push(rating ? Number(rating) : null);
      }
      
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        params.push(notes || null);
      }

      if (cover_url !== undefined) {
        updates.push(`cover_url = $${paramIndex++}`);
        params.push(cover_url || null);
      }

      if (genre !== undefined) {
        updates.push(`genre = $${paramIndex++}`);
        params.push(genre || null);
      }

      if (format !== undefined) {
        updates.push(`format = $${paramIndex++}`);
        params.push(format || null);
      }

      if (owned !== undefined) {
        updates.push(`owned = $${paramIndex++}`);
        params.push(owned === true);
      }

      if (body.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        params.push(body.status || null);
      }

      if (body.startDate !== undefined) {
        updates.push(`start_date = $${paramIndex++}`);
        params.push(body.startDate || null);
      }

      if (body.endDate !== undefined) {
        updates.push(`end_date = $${paramIndex++}`);
        params.push(body.endDate || null);
      }

      // Adiciona email e oldBookName no final
      params.push(email, oldBookName);

      await executeQuery(
        `UPDATE public.reading_data SET ${updates.join(', ')} WHERE email = $${paramIndex++} AND book_name = $${paramIndex}`,
        params
      );
      
      // Atualiza book_reviews se necessário
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

    if (action === "PLAN_READING") {
        await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS author_name TEXT`, []);
        await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS cover_url TEXT`, []);
        await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS notes TEXT`, []);
        await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS owned BOOLEAN`, []);
        await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS format TEXT`, []);
        await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS genre TEXT`, []);

        await executeQuery(`DELETE FROM public.reading_data WHERE email = $1 AND book_name = $2`, [email, bookName]);
        await executeQuery(`
          INSERT INTO public.reading_data (email, book_name, author_name, start_date, status, year, month, cover_url, total_pages, format, owned, notes, genre)
          VALUES ($1, $2, $3, $4, 'planejado', $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          email,
          bookName,
          author || null,
          startDate || null,
          year,
          month,
          coverUrl,
          numPages,
          format || null,
          owned === true,
          notes || null,
          genre || null
        ]);
      return NextResponse.json({ success: true });
    }

    if (action === "START_READING") {
      // Garantir que as colunas existam
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS author_name TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS cover_url TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS genre TEXT`, []);
      
      await executeQuery(`DELETE FROM public.reading_data WHERE email = $1 AND book_name = $2`, [email, bookName]);
      await executeQuery(`
        INSERT INTO public.reading_data (email, book_name, author_name, start_date, status, year, month, cover_url, total_pages, genre)
        VALUES ($1, $2, $3, $4, 'lendo', $5, $6, $7, $8, $9)
      `, [email, bookName, author || null, startDate, year, month, coverUrl, numPages, genre || null]);
      return NextResponse.json({ success: true });
    }

    if (action === "FINISH_READING") {
      const finishedDate = new Date(endDate)
      const finishedYear = finishedDate.getUTCFullYear()
      const finishedMonth = finishedDate.getUTCMonth() + 1

      const existing = await executeQuery(
        `SELECT id FROM public.reading_data WHERE email = $1 AND book_name = $2 LIMIT 1`,
        [email, bookName]
      );

      if (existing.length > 0) {
        await executeQuery(
          `UPDATE public.reading_data SET end_date = $1, status = 'lido', year = $2, month = $3 WHERE email = $4 AND book_name = $5`,
          [endDate, finishedYear, finishedMonth, email, bookName]
        );
      } else {
        await executeQuery(
          `INSERT INTO public.reading_data (email, book_name, author_name, start_date, end_date, status, year, month, cover_url, total_pages, genre)
           VALUES ($1, $2, $3, $4, $5, 'lido', $6, $7, $8, $9, $10)`,
          [
            email,
            bookName,
            author || null,
            startDate || endDate || null,
            endDate,
            finishedYear,
            finishedMonth,
            coverUrl || null,
            numPages,
            genre || null,
          ]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "UPDATE_REVIEW") {
      // Garante compatibilidade de schema antes de atualizar reviews/metadata
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS author_name TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS format TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS owned BOOLEAN`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS genre TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS review TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS rating INTEGER`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS cover_url TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS total_pages INTEGER`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS start_date TEXT`, []);
      await executeQuery(`ALTER TABLE public.reading_data ADD COLUMN IF NOT EXISTS end_date TEXT`, []);

      const userRes = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
      if (userRes.length === 0) return NextResponse.json({ error: "Usuário não encontrado" });
      const userId = userRes[0].id;
      const targetName = oldBookName || bookName;

      // Recalcula o recorte temporal com base na data de conclusão (prioridade)
      // e, se ausente, usa a data de início como fallback.
      const dateRef = endDate || startDate;
      let effectiveYear = year || null;
      let effectiveMonth = month || null;
      if (dateRef) {
        const parsedDate = new Date(dateRef);
        if (!isNaN(parsedDate.getTime())) {
          effectiveYear = parsedDate.getUTCFullYear();
          effectiveMonth = parsedDate.getUTCMonth() + 1;
        }
      }

      if (!effectiveYear) {
        effectiveYear = new Date().getUTCFullYear();
      }
      if (!effectiveMonth) {
        effectiveMonth = new Date().getUTCMonth() + 1;
      }

      const updateParams: any[] = [
        bookName,
        author || null,
        numPages,
        coverUrl,
        genre,
        review,
        rating || null,
        format || null,
        owned === true,
        startDate || null,
        endDate || null,
        effectiveYear,
        effectiveMonth,
      ];

      let whereClause: string;
      if (id) {
        whereClause = `id = $${updateParams.length + 1}`;
        updateParams.push(id);
      } else {
        whereClause = `email = $${updateParams.length + 1} AND book_name = $${updateParams.length + 2}`;
        updateParams.push(email, targetName);
      }

      await executeQuery(
        `UPDATE public.reading_data 
         SET book_name = $1, author_name = $2, total_pages = $3, cover_url = $4, genre = $5, review = $6, rating = $7, format = $8, owned = $9, start_date = $10, end_date = $11, year = $12, month = $13
         WHERE ${whereClause}`,
        updateParams
      );

      await executeQuery(
        `INSERT INTO public.book_reviews (user_id, title, rating, cover_url, total_pages, genre, review, year, month)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id, title) DO UPDATE SET
           rating = EXCLUDED.rating,
           cover_url = EXCLUDED.cover_url,
           total_pages = EXCLUDED.total_pages,
           genre = EXCLUDED.genre,
           review = EXCLUDED.review,
           year = EXCLUDED.year,
           month = EXCLUDED.month`,
          [userId, bookName, rating || 0, coverUrl || "", numPages, genre || "", review || "", effectiveYear, effectiveMonth]
      );

      if (oldBookName && oldBookName !== bookName) {
        await executeQuery(
          `DELETE FROM public.book_reviews WHERE user_id = $1 AND title = $2`,
          [userId, oldBookName]
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
