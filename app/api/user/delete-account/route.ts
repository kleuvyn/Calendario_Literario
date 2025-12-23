export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function DELETE() {
  try {
    const session = await getServerSession(); 
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const email = session.user.email;
    const user = await executeQuery(
      "SELECT id FROM public.users WHERE email = $1",
      [email]
    ) as any[];

    if (user.length > 0) {
      const userId = user[0].id;
      await executeQuery("DELETE FROM public.book_reviews WHERE user_id = $1", [userId]);
      await executeQuery("DELETE FROM public.reading_data WHERE user_id = $1 OR email = $2", [userId, email]);
      await executeQuery("DELETE FROM public.books WHERE user_email = $1", [email]);
      await executeQuery("DELETE FROM public.users WHERE id = $1", [userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}