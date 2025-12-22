import { executeQuery } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const year = Number(searchParams.get("year"));

  if (!email || !year) return NextResponse.json({ data: [] });

  try {
    const query = `
      SELECT rd.*, 
             br.rating, 
             br.cover_url,
             br.genre,
             br.review,
             -- O nome precisa ser total_pages para o cálculo de stats
             COALESCE(br.total_pages, rd.total_pages, 0) as total_pages
      FROM public.reading_data rd
      LEFT JOIN public.users u ON u.email = rd.email
      LEFT JOIN public.book_reviews br ON (u.id = br.user_id AND rd.book_name = br.title)
      WHERE rd.email = $1 AND rd.year = $2
      ORDER BY rd.month ASC, rd.status DESC
    `;
    
    const rows = await executeQuery(query, [email, year]);

    // Garantimos que os campos críticos sejam números para os cálculos de stats
    const cleanRows = rows.map((b: any) => ({
      ...b,
      rating: Number(b.rating) || 0,
      total_pages: Number(b.total_pages) || 0,
      month: Number(b.month)
    }));

    return NextResponse.json({ data: cleanRows });
  } catch (error: any) {
    console.error("Erro na API:", error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, bookName, action, rating, coverUrl, totalPages, review, genre, year, month } = body;
    const pages = Number(totalPages) || 0;

    const userRes = await executeQuery(`SELECT id FROM public.users WHERE email = $1`, [email]);
    if (userRes.length === 0) return NextResponse.json({ error: "Usuário não encontrado" });
    const userId = userRes[0].id;

    if (action === "UPDATE_REVIEW") {
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

      await executeQuery(
        `UPDATE public.reading_data SET total_pages = $1 WHERE email = $2 AND book_name = $3`,
        [pages, email, bookName]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}