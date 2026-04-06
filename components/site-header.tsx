"use client"

import { useSession, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { BookOpen, LogOut } from "lucide-react"
import { THEMES, ThemeKey } from "@/lib/themes"
import { toast } from "sonner"

interface SiteHeaderProps {
  activeTheme: ThemeKey
  setActiveTheme: (t: ThemeKey) => void
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  title?: React.ReactNode
  showLogout?: boolean
}

export function SiteHeader({ activeTheme, setActiveTheme, leftContent, rightContent, title, showLogout = true }: SiteHeaderProps) {
  const { data: session } = useSession()
  const theme = THEMES[activeTheme] || THEMES.light
  const isDark = activeTheme === 'dark'

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false, callbackUrl: '/' })
    } finally {
      window.location.href = '/'
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex flex-col lg:flex-row items-center justify-between backdrop-blur-md p-6 rounded-[2.5rem] shadow-sm gap-6 border border-dashed transition-all duration-300 relative overflow-hidden"
      style={{
        borderColor: `${theme.primary}40`,
        backgroundColor: theme.card,
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Decorative dashed inner border */}
      <div className="absolute top-4 left-4 right-4 bottom-4 border border-dashed rounded-[2rem] pointer-events-none" style={{ borderColor: `${theme.primary}20` }} />

      <div className="flex items-center gap-4 w-full lg:w-auto relative z-10 min-w-0">
        <motion.div whileHover={{ scale: 1.05 }} className="relative shrink-0">
          <div className="h-16 w-16 rounded-full border border-dashed flex items-center justify-center overflow-hidden shadow-sm" style={{ 
            borderColor: `${theme.primary}40`,
            backgroundColor: theme.card,
            backgroundImage: session?.user?.image ? `url('${session.user.image}')` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            {!session?.user?.image && (
              <span className="text-xl font-serif italic" style={{ color: theme.primary }}>
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </motion.div>
        
        <div className="flex flex-col min-w-0">
          {title ? (
            <div className="truncate">{title}</div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-serif font-black italic tracking-tighter lowercase truncate" style={{ color: theme.text }}>
                minha estante
              </h1>
            </div>
          )}
          {leftContent}
        </div>
      </div>

      <div className="flex backdrop-blur-sm p-1.5 rounded-full border border-dashed gap-1 transition-all duration-300 flex-wrap justify-center relative z-10" style={{
        backgroundColor: '#FFFFFF',
        borderColor: `${theme.primary}20`
      }}>
        {Object.entries(THEMES).slice(0, 4).map(([key, value]) => {
          const ThemeIcon = value.icon || BookOpen
          const isActive = activeTheme === key
          return (
            <motion.button 
              key={key} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { 
                setActiveTheme(key as ThemeKey); 
                localStorage.setItem("app-theme", key);
                toast.success(`Tema ${value.name} ativado`, {
                  icon: <ThemeIcon size={14} />
                })
              }} 
              className={`p-2 transition-all rounded-full border border-dashed ${isActive ? 'bg-white shadow-sm scale-110' : 'hover:opacity-75'}`}
              style={{ borderColor: isActive ? 'rgba(140, 123, 110, 0.28)' : 'transparent', opacity: isActive ? 1 : 0.6 }}
            >
              <ThemeIcon 
                size={16} 
                color={value.primary} 
                fill={isActive ? value.primary : "transparent"} 
                strokeWidth={1.5}
                style={{ opacity: isActive ? 1 : 0.4 }}
              />
            </motion.button>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-2 relative z-10 shrink-0">
        {rightContent}
        
        {showLogout && (
          <motion.button 
            type="button"
            whileHover={{ scale: 1.08, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout} 
            className="h-10 w-10 ml-2 rounded-full border border-dashed transition-all flex items-center justify-center"
            style={{
              borderColor: `${theme.primary}40`,
              color: theme.primary,
              backgroundColor: theme.card
            }}
            title="Sair"
          >
            <LogOut size={16} strokeWidth={1.5} style={{ opacity: 0.45 }} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
