import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params; 
    const { title } = await request.json();
    const currentData = await executeQuery(
      "SELECT book_name, email FROM reading_data WHERE id = $1",
      [id]
    ) as any[];

    if (!currentData || currentData.length === 0) {
      return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });
    }

    const oldName = currentData[0].book_name;
    const userEmail = currentData[0].email;
    await executeQuery(
      `UPDATE reading_data SET book_name = $1 WHERE book_name = $2 AND email = $3`,
      [title, oldName, userEmail]
    );
    try {
      await executeQuery(
        `UPDATE book_reviews SET book_name = $1 WHERE book_name = $2 AND user_email = $3`,
        [title, oldName, userEmail]
      );
    } catch (e) { 
      console.log("Tabela book_reviews não encontrada ou coluna diferente, pulando..."); 
    }

    return NextResponse.json({ message: "Atualizado com sucesso!" });
  } catch (error: any) {
    console.error("Erro Crítico na API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
  
    const data = await executeQuery("SELECT book_name, email FROM reading_data WHERE id = $1", [id]) as any[];
    
    if (data.length > 0) {
      const { book_name, email } = data[0];
      await executeQuery("DELETE FROM reading_data WHERE book_name = $1 AND email = $2", [book_name, email]);
      await executeQuery("DELETE FROM book_reviews WHERE book_name = $1 AND user_email = $2", [book_name, email]);
    }

    return NextResponse.json({ message: "Excluído de todo o sistema" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}