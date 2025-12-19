import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Você precisa estar logado" }, { status: 401 });
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "URL da imagem não enviada" }, { status: 400 });
    }

    await executeQuery(
      "UPDATE users SET image = $1 WHERE email = $2",
      [image, session.user.email]
    );

    return NextResponse.json({ message: "Foto de perfil atualizada!" });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}