import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import bcrypt from "bcrypt"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    const existingUsers = await executeQuery(
      "SELECT * FROM users WHERE email = $1",
      [email]
    ) as any[]

    if (existingUsers.length > 0) {
      const user = existingUsers[0]

      return NextResponse.json(
        { error: "Este e-mail já está em uso. Se você usou o Google, continue fazendo login pelo Google." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await executeQuery(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)`,
      [name, email, hashedPassword]
    )

    return NextResponse.json({ message: "Usuário registrado com sucesso!" }, { status: 201 })
  } catch (error: any) {
    console.error("Erro no Registro:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}