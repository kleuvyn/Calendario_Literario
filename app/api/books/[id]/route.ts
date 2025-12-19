import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
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

    const oldName = currentData[0].book_name;
    const userId = currentData[0].user_id;
    const email = currentData[0].email;

    await executeQuery(
      `UPDATE public.reading_data SET book_name = $1 WHERE book_name = $2 AND (user_id = $3 OR email = $4)`,
      [newName, oldName, userId, email]
    );

    await executeQuery(
      `UPDATE public.book_reviews SET title = $1 WHERE title = $2 AND user_id = $3`,
      [newName, oldName, userId]
    );
    
    await executeQuery(
      `UPDATE public.books SET title = $1 WHERE title = $2`,
      [newName, oldName]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const data = await executeQuery(
      "SELECT book_name, user_id, email FROM public.reading_data WHERE id = $1", 
      [id]
    ) as any[];
    
    if (data.length > 0) {
      const { book_name, user_id, email } = data[0];
      
      await executeQuery(
        "DELETE FROM public.reading_data WHERE book_name = $1 AND (user_id = $2 OR email = $3)", 
        [book_name, user_id, email]
      );
      
      await executeQuery(
        "DELETE FROM public.book_reviews WHERE title = $1 AND user_id = $2", 
        [book_name, user_id]
      );
    }

    return NextResponse.json({ message: "Excluído" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}