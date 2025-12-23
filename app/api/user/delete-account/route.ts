export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "@/lib/auth"; 

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const email = session.user.email;
    const userResult = await executeQuery(
      "SELECT id FROM public.users WHERE email = $1",
      [email]
    ) as any[];

    if (userResult.length > 0) {
      const userId = userResult[0].id;

      await executeQuery("DELETE FROM public.book_reviews WHERE user_id = $1", [userId]).catch(e => console.log("Erro na tabela book_reviews:", e.message));
      
      await executeQuery("DELETE FROM public.reading_data WHERE user_id = $1 OR email = $2", [userId, email]).catch(e => console.log("Erro na tabela reading_data:", e.message));
      
      try {
          await executeQuery("DELETE FROM public.books WHERE user_id = $1", [userId]);
      } catch (e) {
          console.log("Tentativa 1 em 'books' falhou, tentando por email...");
          try {
              await executeQuery("DELETE FROM public.books WHERE user_email = $1", [email]);
          } catch (e2) {
              console.log("Aviso: Não foi possível limpar a tabela 'books'. Verifique o nome da coluna de usuário.");
          }
      }
      
      await executeQuery("DELETE FROM public.users WHERE id = $1", [userId]);
      
      console.log(`LGPD: Limpeza concluída para ${email}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("ERRO FINAL NO DELETE:", error.message);
    return NextResponse.json({ error: "Erro interno no servidor", details: error.message }, { status: 500 });
  }
}