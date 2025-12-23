"use client"

import { useSession, signOut } from "next-auth/react"
import { CalendarContent } from "@/components/CalendarContent"
import { BookOpen, ShieldAlert, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { status } = useSession()

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "LGPD - DIREITO AO ESQUECIMENTO:\n\nEsta ação apagará permanentemente todos os seus livros, reviews e dados de conta dos nossos servidores. Deseja continuar?"
    )

    if (confirmed) {
      try {
        const res = await fetch("/api/user/delete-account", { method: "DELETE" })
        if (res.ok) {
          alert("Todos os seus dados foram removidos com sucesso.")
          signOut({ callbackUrl: "/" })
        } else {
          alert("Erro ao processar a exclusão. Tente novamente.")
        }
      } catch (err) {
        console.error("Erro na exclusão:", err)
      }
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <BookOpen className="h-8 w-8 animate-pulse text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="grow pb-24">
        <CalendarContent />
      </main>

      <footer className="w-full border-t border-slate-200 bg-slate-50 p-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldAlert size={18} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                Conformidade LGPD
              </span>
              <span className="text-[9px] text-slate-400">
                Seus dados são protegidos e você tem o direito de removê-los a qualquer momento.
              </span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleDeleteAccount}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-[10px] font-black uppercase tracking-widest h-10 px-6"
          >
            <Trash2 className="mr-2 h-4 w-4" /> 
            Excluir minha conta e dados
          </Button>
        </div>
      </footer>
    </div>
  )
}