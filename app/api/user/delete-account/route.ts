export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("Sessão não encontrada na API");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const email = session.user.email;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}