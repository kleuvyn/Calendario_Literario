"use client"

import { useSession, signOut } from "next-auth/react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Trash2, BarChart3, BookOpen, Sparkles } from "lucide-react" 
import Link from "next/link" 
import { motion } from "framer-motion"

export function Header() {
  const { data: session } = useSession()

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "LGPD - DIREITO AO ESQUECIMENTO:\n\nEsta ação apagará permanentemente todos os seus dados. Deseja continuar?"
    )

    if (confirmed) {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" })
      if (res.ok) {
        alert("Dados excluídos com sucesso.")
        signOut({ callbackUrl: "/" })
      }
    }
  }

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-slate-200/30 bg-linear-to-r from-white via-slate-50/50 to-white backdrop-blur-xl sticky top-0 z-50 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo/Título */}
        <Link href="/dashboard" className="group cursor-pointer">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-linear-to-r from-primary/5 to-primary/10 border-2 border-primary/20 shadow-sm hover:shadow-md transition-all"
          >
            <BookOpen className="text-primary" size={24} />
            <span className="font-black uppercase tracking-tighter text-xl text-slate-800 group-hover:text-primary transition-colors">
              Minha Estante
            </span>
            <Sparkles className="text-primary opacity-60" size={16} />
          </motion.div>
        </Link>

        {/* Navegação e Perfil */}
        <div className="flex items-center gap-6">
          {/* Link Retrospectiva */}
          <Link href="/retrospectiva">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-linear-to-r from-slate-100 to-slate-50 border-2 border-slate-200 text-slate-700 hover:border-primary hover:text-primary hover:shadow-md transition-all cursor-pointer"
            >
              <BarChart3 size={20} />
              <span className="font-bold text-sm uppercase tracking-wide">Retrospectiva</span>
            </motion.div>
          </Link>

          {/* Avatar com Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar className="h-12 w-12 border-4 border-primary/20 hover:border-primary/40 shadow-md hover:shadow-lg transition-all cursor-pointer">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-linear-to-br from-primary/80 to-primary text-white font-bold text-lg">
                    {session?.user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl border-2 shadow-xl p-2">
              <DropdownMenuLabel className="text-center py-3">
                <p className="font-bold text-lg">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{session?.user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              
              {/* Link mobile para retrospectiva */}
              <Link href="/retrospectiva" className="sm:hidden">
                <DropdownMenuItem className="cursor-pointer py-3 rounded-lg">
                  <BarChart3 className="mr-3 h-5 w-5 text-primary" /> 
                  <span className="font-medium">Retrospectiva</span>
                </DropdownMenuItem>
              </Link>
              
              <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer py-3 rounded-lg hover:bg-slate-100">
                <LogOut className="mr-3 h-5 w-5 text-slate-600" /> 
                <span className="font-medium">Sair</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem onClick={handleDeleteAccount} className="text-red-600 cursor-pointer py-3 rounded-lg hover:bg-red-50">
                <Trash2 className="mr-3 h-5 w-5" /> 
                <span className="font-medium">Excluir dados (LGPD)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}