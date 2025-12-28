import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const { title: newName } = await request.json();

    const currentData = await executeQuery(
      "SELECT book_name, user_id, email FROM public.reading_data WHERE id = $1",
      [id]
    ) as any[];

    if (!currentData || currentData.length === 0) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const { book_name: oldName, user_id: userId, email } = currentData[0];

    await executeQuery(
      `UPDATE public.reading_data SET book_name = $1 WHERE id = $2`,
      [newName, id]
    );

    if (userId) {
      try {
        await executeQuery(
          `UPDATE public.book_reviews SET title = $1 WHERE title = $2 AND user_id = $3`,
          [newName, oldName, userId]
        );
      } catch (e) { console.error("Erro ao atualizar reviews:", e); }
    }

    if (email) {
      try {
        await executeQuery(
          `UPDATE public.books SET title = $1 WHERE title = $2 AND user_email = $3`,
          [newName, oldName, email]
        );
      } catch (e) {
        console.log("Falha ao atualizar tabela books (user_email não existe), tentando 'email'...");
        try {
          await executeQuery(
            `UPDATE public.books SET title = $1 WHERE title = $2 AND email = $3`,
            [newName, oldName, email]
          );
        } catch (e2) {
          console.error("A tabela 'books' não possui coluna de email conhecida.");
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: any }
) {
  try {
    const { id } = await params;

    const data = await executeQuery(
      "SELECT book_name, user_id, email FROM public.reading_data WHERE id = $1",
      [id]
    ) as any[];

    if (data && data.length > 0) {
      const { book_name, user_id, email } = data[0];

      await executeQuery("DELETE FROM public.reading_data WHERE id = $1", [id]);

      try {
        await executeQuery("DELETE FROM public.book_reviews WHERE title = $1 AND user_id = $2", [book_name, user_id]);
      } catch (e) {}
      
      try {
        await executeQuery("DELETE FROM public.books WHERE title = $1 AND (email = $2 OR user_email = $2)", [book_name, email]);
      } catch (e) {}
    }

    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}