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
import { LogOut, Trash2 } from "lucide-react"

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
    <header className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="font-black uppercase tracking-tighter text-slate-800">
          Minha Estante
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-9 w-9 border-2 border-primary/10">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDeleteAccount} className="text-red-600 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir dados (LGPD)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}