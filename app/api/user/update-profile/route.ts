import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    await executeQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'rose';", []);

    const result = await executeQuery(
      "SELECT image, theme FROM users WHERE email = $1",
      [email]
    );

    const userData = result[0] || {};
    return NextResponse.json({
      image: userData.image || null,
      theme: userData.theme || 'rose'
    });
  } catch (error) {
    console.error("Erro no GET profile:", error);
    return NextResponse.json({ theme: 'rose' }, { status: 200 }); // Retorna rose mesmo no erro para não quebrar o gráfico
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { image, theme } = await request.json();

    if (image) {
      await executeQuery("UPDATE users SET image = $1 WHERE email = $2", [image, session.user.email]);
    }

    if (theme) {
      await executeQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'rose';", []);
      await executeQuery("UPDATE users SET theme = $1 WHERE email = $2", [theme, session.user.email]);
    }

    return NextResponse.json({ message: "Perfil atualizado!" });
  } catch (error) {
    console.error("Erro no POST profile:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}