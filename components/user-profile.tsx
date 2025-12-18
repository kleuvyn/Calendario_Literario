"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export function UserProfile() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <div className="flex items-center justify-between p-4 mb-6 bg-card border rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-primary overflow-hidden bg-muted">
          {session.user.image ? (
            <img 
              src={session.user.image} 
              alt="Avatar" 
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10">
              <User className="text-primary h-6 w-6" />
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-none">{session.user.name}</span>
          <span className="text-[10px] text-muted-foreground">{session.user.email}</span>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 text-xs"
        onClick={() => signOut()}
      >
        <LogOut size={14} />
        Sair
      </Button>
    </div>
  )
}