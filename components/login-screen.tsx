"use client"

import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card" 
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input" 
import { BookOpen, Loader2, Sparkles, Book, Users, TrendingUp, Coffee, PenTool, Library, CalendarDays, BarChart, CalendarHeart } from "lucide-react" 
import { type UserData } from "@/lib/storage"
import { THEMES, ThemeKey } from "@/lib/themes"
import { motion, AnimatePresence } from "framer-motion"

interface LoginScreenProps {
  onLogin: (userData: UserData) => void
}

const GoogleIcon = ({ color }: { color: string }) => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill={color} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill={color} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill={color} d="M5.84 14.09c-.22-.66-.35-1.09-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill={color} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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

    // Sincroniza o atributo do documento para garantir que classes CSS de cores não-inline sejam aplicadas
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

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
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${theme.bg} 0%, #0F0E0D 100%)`
          : `linear-gradient(135deg, ${theme.bg} 0%, #E8E4DF 50%, ${theme.primary}25 100%)`,
        color: theme.text,
        fontFamily: "'Spectral', 'Georgia', serif",
      }}
    >
      {/* Decorative elements - Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/handmade-paper.png")` }} />

      {/* Floating Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[100px] -z-10" 
        style={{ backgroundColor: theme.primary }} 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.05, 0.15, 0.05],
          x: [0, -40, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] -z-10" 
        style={{ backgroundColor: theme.primary }} 
      />

      <div className="w-full max-w-6xl grid md:grid-cols-[1.2fr_1fr] gap-12 items-center relative z-10">
        {/* Left side - Hero Visual */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:flex flex-col justify-center space-y-10"
        >
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-2 border shadow-sm"
              style={{ 
                backgroundColor: `${theme.primary}10`, 
                color: theme.primary,
                borderColor: `${theme.primary}30` 
              }}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Seu Ano em Páginas
            </motion.div>
            
            <h1 className="text-6xl font-bold leading-[1.1] tracking-tight" style={{ color: theme.text }}>
              O tempo e as <br />
              <span className="italic font-serif" style={{ color: theme.primary }}>suas leituras</span>
            </h1>
            
            <p className="text-xl max-w-lg leading-relaxed font-light" style={{ color: isDark ? "rgba(245,245,245,0.8)" : "rgba(74,68,63,0.85)" }}>
              Seu calendário literário digital. Registre seus dias lidos, organize suas metas anuais e acompanhe seu progresso de leitura mês a mês.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border bg-opacity-50 backdrop-blur-sm transition-transform hover:scale-[1.02]" 
                 style={{ backgroundColor: `${theme.card}40`, borderColor: `${theme.primary}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.primary}15` }}>
                <CalendarHeart className="h-5 w-5" style={{ color: theme.primary }} />
              </div>
              <h3 className="font-bold mb-1" style={{ color: theme.text }}>Calendário Ativo</h3>
              <p className="text-sm leading-relaxed" style={{ color: isDark ? "rgba(245,245,245,0.6)" : "rgba(74,68,63,0.7)" }}>Acompanhe sua constância de leitura diária.</p>
            </div>

            <div className="p-5 rounded-2xl border bg-opacity-50 backdrop-blur-sm transition-transform hover:scale-[1.02]" 
                 style={{ backgroundColor: `${theme.card}40`, borderColor: `${theme.primary}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.primary}15` }}>
                <BarChart className="h-5 w-5" style={{ color: theme.primary }} />
              </div>
              <h3 className="font-bold mb-1" style={{ color: theme.text }}>Metas & Retrospectiva</h3>
              <p className="text-sm leading-relaxed" style={{ color: isDark ? "rgba(245,245,245,0.6)" : "rgba(74,68,63,0.7)" }}>Defina e visualize seus objetivos anuais.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 text-sm font-medium" style={{ color: `${theme.primary}CC` }}>
            <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Estética de Diário</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${theme.primary}30` }} />
            <span className="flex items-center gap-1.5"><Book className="h-4 w-4" /> Notas e Resenhas</span>
          </div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="w-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-10 border-none relative overflow-hidden" 
                style={{ backgroundColor: theme.card }}>
            
            {/* Subtle card decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none" 
                 style={{ 
                   background: `radial-gradient(circle at top right, ${theme.primary}, transparent 70%)` 
                 }} />

            <div className="mb-10 text-center relative z-10">
              <div className="mb-8 flex justify-center">
                <motion.div 
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl relative bg-white transition-all" 
                >
                  <img 
                    src="/logo.png" 
                    alt="Logo Calendário Literário" 
                    className="w-full h-full object-cover rounded-[2rem]" 
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <Coffee className="h-3 w-3" style={{ color: theme.primary }} />
                  </div>
                </motion.div>
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-2" style={{ color: theme.text }}>
                Calendário Literário
              </h2>
              <p className="text-lg font-medium italic opacity-60" style={{ color: theme.text }}>
                {isRegistering ? "Comece seu novo capítulo" : "Folheie seu diário agora"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.form 
                key={isRegistering ? "register" : "login"}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleEmailAction} 
                className="space-y-5 relative z-10"
              >
                {isRegistering && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest opacity-70" style={{ color: theme.text }}>Nome de Autor</label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 rounded-2xl border-2 transition-all focus:ring-0"
                      style={{ 
                        borderColor: `${theme.primary}15`, 
                        backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(140,123,110,0.03)", 
                        color: theme.text 
                      }}
                    />
                  </motion.div>
                )}

                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest opacity-70" style={{ color: theme.text }}>E-mail</label>
                  <Input
                    type="email"
                    placeholder="exemplo@livro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-2xl border-2 transition-all focus:ring-0"
                    style={{ 
                      borderColor: `${theme.primary}15`, 
                      backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(140,123,110,0.03)", 
                      color: theme.text 
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest opacity-70" style={{ color: theme.text }}>Senha</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-2xl border-2 transition-all focus:ring-0"
                    style={{ 
                      borderColor: `${theme.primary}15`, 
                      backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(140,123,110,0.03)", 
                      color: theme.text 
                    }}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-white font-bold rounded-2xl mt-4 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.98]" 
                  style={{ background: `linear-gradient(90deg, ${theme.primary}, ${isDark ? "#BFB1A5" : "#6E5B4E"})` }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    isRegistering ? "Criar meu Diário" : "Abrir Diário"
                  )}
                </Button>
              </motion.form>
            </AnimatePresence>

            <div className="mt-8 text-center relative z-10">
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-bold hover:underline decoration-2 underline-offset-4 pointer-events-auto"
                style={{ color: theme.primary }}
              >
                {isRegistering ? "Prefiro entrar na minha conta" : "Deseja começar um novo diário?"}
              </button>
            </div>

            <div className="my-8 flex items-center gap-4 relative z-10 px-4">
              <div className="h-[1px] flex-1 opacity-20" style={{ backgroundColor: theme.primary }} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>ou</span>
              <div className="h-[1px] flex-1 opacity-20" style={{ backgroundColor: theme.primary }} />
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-14 gap-3 rounded-2xl font-bold transition-all hover:bg-opacity-90 border-2 active:scale-[0.98]"
              variant="outline"
              style={{
                backgroundColor: "transparent",
                color: theme.text,
                borderColor: `${theme.primary}20`,
              }}
            >
              <GoogleIcon color={theme.primary} />
              Continuar com Google
            </Button>
          </Card>

          {/* Footer phrase */}
          <p className="mt-8 text-center text-xs font-semibold tracking-widest uppercase opacity-30" style={{ color: theme.text }}>
            Seu tempo em páginas, dias e livros.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
