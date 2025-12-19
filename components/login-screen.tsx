"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card" 
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input" 
import { BookOpen, Loader2 } from "lucide-react" 
import { type UserData } from "@/lib/storage"

interface LoginScreenProps {
  onLogin: (userData: UserData) => void
}

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (isRegistering) {
      // Lógica de CADASTRO (Cria o usuário no banco primeiro)
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          alert("Conta criada com sucesso! Agora faça o login.")
          setIsRegistering(false)
        } else {
          alert("Erro ao criar conta. Verifique se o e-mail já existe.")
        }
      } catch (error) {
        alert("Erro de conexão.")
      }
    } else {
      // Lógica de LOGIN (Chama a função da Home que executa o signIn)
      onLogin({
        name,
        email,
        password, // Agora passamos a senha!
        provider: "credentials"
      })
    }
    
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    await signIn("google", { callbackUrl: "/" }) 
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-accent/20 bg-card p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-primary/10 p-4">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">Literário</h1>
          <p className="text-muted-foreground">
            {isRegistering ? "Crie sua conta para começar" : "Entre para acessar suas leituras"}
          </p>
        </div>

        <form onSubmit={handleEmailAction} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="mb-2 block text-sm font-medium">Nome</label>
              <Input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Senha</label>
            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRegistering ? "Criar Conta" : "Entrar com Email")}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-primary hover:underline"
          >
            {isRegistering ? "Já tem conta? Entre aqui" : "Não tem conta? Cadastre-se"}
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full gap-3 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm"
          size="lg"
        >
          <GoogleIcon />
          Entrar com Google
        </Button>
      </Card>
    </div>
  )
}