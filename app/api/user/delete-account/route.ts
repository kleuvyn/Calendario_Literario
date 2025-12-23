export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "@/lib/auth"; 

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.error("Tentativa de exclusão sem sessão válida.");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const email = session.user.email;
    const userResult = await executeQuery(
      "SELECT id FROM public.users WHERE email = $1",
      [email]
    ) as any[];

    if (userResult.length > 0) {
      const userId = userResult[0].id;

      await executeQuery("DELETE FROM public.book_reviews WHERE user_id = $1", [userId]);
      await executeQuery("DELETE FROM public.reading_data WHERE user_id = $1 OR email = $2", [userId, email]);
      await executeQuery("DELETE FROM public.books WHERE user_email = $1", [email]);
      await executeQuery("DELETE FROM public.users WHERE id = $1", [userId]);
      
      console.log(`LGPD: Todos os dados de ${email} foram removidos.`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro crítico na deleção:", error);
    return NextResponse.json({ error: "Erro interno ao processar exclusão" }, { status: 500 });
  }
}