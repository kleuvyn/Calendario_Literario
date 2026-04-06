"use client"

import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card" 
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input" 
import { BookOpen, Loader2, Sparkles, Book, Users, TrendingUp } from "lucide-react" 
import { type UserData } from "@/lib/storage"
import { THEMES, ThemeKey } from "@/lib/themes"

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
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("light")
  const router = useRouter()

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as ThemeKey
    if (savedTheme && THEMES[savedTheme]) {
      setActiveTheme(savedTheme)
    }
  }, [])

  const theme = THEMES[activeTheme] || THEMES.light
  const isDark = activeTheme === "dark"

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (isRegistering) {
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
      onLogin({
        name,
        email,
        password,
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${theme.bg} 0%, #151413 100%)`
          : `linear-gradient(135deg, ${theme.bg} 0%, #FCFAF7 45%, #F1EAE2 100%)`,
        color: theme.text,
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -z-10" style={{ backgroundColor: `${theme.primary}33` }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl -z-10" style={{ backgroundColor: `${theme.primary}22` }} />

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero */}
        <div className="hidden md:flex flex-col justify-center space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
              <Sparkles className="h-4 w-4" />
              Seu Diário Literário e Calendário Literário
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight" style={{ color: theme.text }}>
              Organize suas Leituras
            </h1>
            <p className="text-xl" style={{ color: isDark ? "rgba(245,245,245,0.75)" : "rgba(74,68,63,0.8)" }}>
              Acompanhe cada livro que você lê, defina metas anuais e revise suas leituras com estilo.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.primary}20` }}>
                <BookOpen className="h-6 w-6" style={{ color: theme.primary }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: theme.text }}>Calendário Interativo</h3>
                <p className="text-sm" style={{ color: isDark ? "rgba(245,245,245,0.7)" : "rgba(74,68,63,0.75)" }}>Visualize seus livros lidos ao longo do ano</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.primary}18` }}>
                <TrendingUp className="h-6 w-6" style={{ color: theme.primary }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: theme.text }}>Acompanhe Metas</h3>
                <p className="text-sm" style={{ color: isDark ? "rgba(245,245,245,0.7)" : "rgba(74,68,63,0.75)" }}>Defina objetivos e monitore seu progresso</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.primary}16` }}>
                <Book className="h-6 w-6" style={{ color: theme.primary }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: theme.text }}>Resenhas e Notas</h3>
                <p className="text-sm" style={{ color: isDark ? "rgba(245,245,245,0.7)" : "rgba(74,68,63,0.75)" }}>Registre suas impressões sobre cada leitura</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <Card className="w-full shadow-2xl rounded-2xl p-8" style={{ backgroundColor: theme.card, borderColor: `${theme.primary}28`, borderWidth: 1 }}>
          <div className="mb-8">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${isDark ? "#D1C7BD" : "#B09A88"})` }}>
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-center text-3xl font-bold mb-2" style={{ color: theme.text }}>
              Literário
            </h2>
            <p className="text-center" style={{ color: isDark ? "rgba(245,245,245,0.75)" : "rgba(74,68,63,0.8)" }}>
              {isRegistering ? "Crie sua conta para começar" : "Bem-vindo de volta!"}
            </p>
          </div>

          <form onSubmit={handleEmailAction} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="mb-2 block text-sm font-semibold" style={{ color: theme.text }}>Nome Completo</label>
                <Input
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 rounded-lg"
                  style={{ borderColor: `${theme.primary}30`, backgroundColor: isDark ? "rgba(38,36,34,0.65)" : "#FFFFFF", color: theme.text }}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold" style={{ color: theme.text }}>Email</label>
              <Input
                type="email"
                placeholder="você@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-lg"
                style={{ borderColor: `${theme.primary}30`, backgroundColor: isDark ? "rgba(38,36,34,0.65)" : "#FFFFFF", color: theme.text }}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" style={{ color: theme.text }}>Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-lg"
                style={{ borderColor: `${theme.primary}30`, backgroundColor: isDark ? "rgba(38,36,34,0.65)" : "#FFFFFF", color: theme.text }}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 gap-2 text-white font-semibold rounded-lg mt-6" 
              style={{ background: `linear-gradient(90deg, ${theme.primary}, ${isDark ? "#B8A99D" : "#9E8A7A"})` }}
              size="lg" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                isRegistering ? "Criar Conta" : "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-medium transition"
              style={{ color: theme.primary }}
            >
              {isRegistering ? "Já tem conta? Entre aqui" : "Não tem conta? Cadastre-se"}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: `${theme.primary}28` }} />
            <span className="text-xs font-medium" style={{ color: isDark ? "rgba(245,245,245,0.7)" : "rgba(74,68,63,0.65)" }}>OU</span>
            <div className="h-px flex-1" style={{ backgroundColor: `${theme.primary}28` }} />
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-11 gap-3 shadow-sm rounded-lg font-medium transition"
            style={{
              backgroundColor: isDark ? "rgba(38,36,34,0.85)" : "#FFFFFF",
              color: theme.text,
              borderColor: `${theme.primary}32`,
              borderWidth: 1,
            }}
            size="lg"
          >
            <GoogleIcon />
            Continuar com Google
          </Button>
        </Card>
      </div>
    </div>
  )
}