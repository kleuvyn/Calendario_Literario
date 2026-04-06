"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, Star, Bookmark, CalendarDays, Quote, PenTool, ChevronDown, ChevronRight, Sparkles } from "lucide-react"
import { getReadingData } from "@/lib/api-client"
import { OptimizedBookCover } from "@/components/optimized-book-cover"
import { SiteHeader } from "@/components/site-header"
import { THEMES, ThemeKey } from "@/lib/themes"

const getProxyUrl = (url: string) => {
  const trimmedUrl = url?.trim() || ""
  if (!trimmedUrl) return ""
  if (trimmedUrl.startsWith('data:image/')) return trimmedUrl
  return `https://images.weserv.nl/?url=${encodeURIComponent(trimmedUrl.replace("http://", "https://"))}`
}

const renderStars = (rating?: number, color?: string) => {
  const value = Number(rating) || 0
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          size={10} 
          strokeWidth={i < value ? 0 : 1}
          style={{ 
            color: i < value ? color : '#cbd5e1',
            fill: i < value ? color : 'transparent' 
          }}
        />
      ))}
    </div>
  )
}

export default function BookDiaryPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({})
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('light')

  const bookName = decodeURIComponent(Array.isArray(params?.bookName) ? params.bookName[0] : (params?.bookName || ""))
  const currentYear = 2026

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as keyof typeof THEMES
    if (savedTheme && THEMES[savedTheme]) setActiveTheme(savedTheme)
  }, [])

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return
    getReadingData(session.user.email, currentYear, true, undefined, undefined, true).then((data) => {
      const books: any[] = Array.isArray(data) ? data : data?.data || []
      setAllBooks(books)
      setLoading(false)
      
      const currentBook = books.find(b => b.book_name?.toLowerCase() === bookName.toLowerCase())
      if (currentBook) {
        const year = currentBook.end_date ? new Date(currentBook.end_date).getFullYear() : currentYear
        setOpenYears(prev => ({ ...prev, [year]: true }))
      }
    })
  }, [status, session, bookName])

  const toggleYear = (year: number) => {
    setOpenYears(prev => ({ ...prev, [year]: !prev[year] }))
  }

  const normalizeStatus = (status?: string) => (status || '').toLowerCase().trim()
  const isFinishedStatus = (status?: string) => {
    const normalized = normalizeStatus(status)
    return ['lido', 'finished', 'concluido', 'concluído', 'read', 'finalizado'].includes(normalized)
  }
  const isPlannedStatus = (status?: string) => {
    const normalized = normalizeStatus(status)
    return ['planejado', 'planned', 'quero-ler', 'quero ler', 'wishlist', 'desejado'].includes(normalized)
  }

  const book = allBooks.find(b => b.book_name?.toLowerCase() === bookName.toLowerCase())
  const readBooks = allBooks.filter(b => isFinishedStatus(b.status))

  const theme = THEMES[activeTheme] || THEMES.light
  const editorial = {
    bg: '#FAFAF5',
    text: '#4A443F',
    accent: '#8C7B6E',
    card: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.08)',
    subtle: 'rgba(74, 68, 63, 0.5)',
  }

  const readBooksByYear = useMemo(() => {
    const groups: Record<number, any[]> = {}
    readBooks.forEach((b) => {
      const year = b.end_date ? new Date(b.end_date).getFullYear() : (b.year ? Number(b.year) : currentYear)
      if (!groups[year]) groups[year] = []
      groups[year].push(b)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, books]) => ({ year: Number(year), books }))
  }, [readBooks])

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif italic" style={{ backgroundColor: editorial.bg, color: editorial.accent }}>Abrindo os arquivos de afeto...</div>

  return (
    <div className="min-h-screen text-slate-900 font-serif pb-20" style={{ backgroundColor: editorial.bg, color: editorial.text }}>
      <div className="h-2 w-full border-t-[3px] border-dashed opacity-30" style={{ borderColor: editorial.accent }} />

      <div className="max-w-7xl mx-auto px-6 pt-16">
        <SiteHeader
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
            title={
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <span className="h-[1px] w-8 border-t border-dashed" style={{ borderColor: editorial.accent }} />
                   <span className="text-[10px] uppercase tracking-[0.5em] font-bold" style={{ color: editorial.accent }}>Memorial de afeto</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-serif italic font-black tracking-tighter" style={{ color: editorial.text }}>
                  Meu diário <span className="italic font-normal opacity-70" style={{ color: editorial.accent }}>literário</span>
                </h1>
              </div>
            }
            rightContent={
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/" className="inline-flex items-center justify-center gap-3 text-xs uppercase tracking-widest font-bold transition-all px-8 py-3 rounded-full border border-dashed hover:opacity-70" style={{ color: editorial.text, borderColor: editorial.border, backgroundColor: editorial.card }}>
                  <ArrowLeft size={14} /> Estante
                </Link>
                <Link href="/" className="inline-flex items-center justify-center gap-3 text-xs uppercase tracking-widest font-bold transition-all px-8 py-3 rounded-full border border-dashed hover:opacity-90 shadow-sm" style={{ color: editorial.accent, borderColor: editorial.border, backgroundColor: editorial.card }}>
                  <Sparkles size={14} style={{ opacity: 0.4 }} /> Meus livros lidos
                </Link>
              </div>
            }
            showLogout={false}
          />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 items-start">
          
          <main className="space-y-16">
            {book ? (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header do Livro */}
                <div className="backdrop-blur-sm p-10 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-dashed rounded-[2rem] relative overflow-hidden group" style={{ borderColor: editorial.border, backgroundColor: editorial.card }}>
                  <div className="grid md:grid-cols-[240px_1fr] gap-12 relative z-10">
                    <div className="relative aspect-[2/3] shadow-md rounded-sm overflow-hidden border border-dashed p-1" style={{ borderColor: editorial.border, background: editorial.bg }}>
                      <OptimizedBookCover src={getProxyUrl(book.cover_url)} alt={book.book_name} fill className="object-cover rounded-sm" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black leading-[1.05] mb-6 italic break-words whitespace-normal" style={{ color: editorial.text }}>{book.book_name}</h2>
                      <div className="grid grid-cols-2 gap-8 border-t border-dashed pt-8 mt-4" style={{ borderColor: editorial.border }}>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: editorial.subtle }}>escrito por</p>
                          <p className="text-lg font-serif italic" style={{ color: editorial.text }}>{book.author_name || book.author}</p>
                        </div>
                        <div className="border-l border-dashed pl-8" style={{ borderColor: editorial.border }}>
                          <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: editorial.subtle }}>minha nota</p>
                          <div className="inline-flex p-2 rounded-lg border border-dashed" style={{ borderColor: editorial.border, backgroundColor: editorial.bg }}>
                            {renderStars(book.rating, editorial.accent)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas do Diário */}
                <div className="relative">
                  <div className="backdrop-blur-sm rounded-[2rem] shadow-sm border border-dashed overflow-hidden" style={{ borderColor: editorial.border, backgroundColor: editorial.card }}>
                    <div className="px-10 py-8 border-b border-dashed flex items-center justify-between" style={{ borderColor: editorial.border, backgroundColor: editorial.bg }}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl shadow-sm border border-dashed flex items-center justify-center bg-white" style={{ color: editorial.accent, borderColor: editorial.border }}>
                          <PenTool size={18} />
                        </div>
                        <h3 className="font-serif italic font-black text-xl md:text-2xl tracking-tighter" style={{ color: editorial.text }}>Notas do coração</h3>
                      </div>
                      <Quote size={28} style={{ color: editorial.accent, opacity: 0.2 }} />
                    </div>
                    <div className="p-6 md:p-14 relative min-h-[260px] md:min-h-[400px]" style={{ backgroundImage: `linear-gradient(${editorial.bg} 1px, transparent 1px)`, backgroundSize: '100% 1.5rem', lineHeight: 1 }}>
                      <div className="absolute left-6 md:left-14 top-0 bottom-0 w-[1px] border-l border-dashed" style={{ borderColor: editorial.border }} />
                      <div className="relative z-10 pl-4 md:pl-12">
                        <p className="font-serif text-[14px] md:text-[18px] leading-[1] whitespace-pre-line italic" style={{ color: editorial.text }}>
                          {book.review || "nenhuma anotação... apenas suspiros guardados."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[500px] flex flex-col items-center justify-center border border-dashed rounded-[3rem] font-serif italic text-xl" style={{ borderColor: editorial.border, color: editorial.text, opacity: 0.6, backgroundColor: editorial.card }}>
                <Quote size={40} className="mb-4" style={{ color: editorial.accent, opacity: 0.3 }} />
                Nenhuma memória foi selecionada nas páginas do tempo...
              </div>
            )}
          </main>

          <aside className="space-y-8 lg:sticky lg:top-12">
            {/* Arquivo de Memórias */}
            <section className="backdrop-blur-sm p-8 rounded-[2rem] border border-dashed shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow duration-500" style={{ borderColor: editorial.border, backgroundColor: editorial.card }}>
              <div className="mb-6 flex items-center gap-4 border-b border-dashed pb-5" style={{ borderColor: editorial.border }}>
                <div className="p-2.5 rounded-xl border border-dashed bg-white" style={{ color: editorial.accent, borderColor: editorial.border }}>
                    <CalendarDays size={18} />
                </div>
                <div>
                    <h3 className="font-serif italic font-black text-xl tracking-tighter" style={{ color: editorial.text }}>Arquivos</h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: editorial.subtle }}>cronologia de afeto</p>
                </div>
              </div>

              <div className="space-y-3">
                {readBooksByYear.map(({ year, books }) => (
                  <div key={year} className="border border-dashed rounded-2xl px-3 py-1 transition-colors bg-white/50 hover:bg-white" style={{ borderColor: editorial.border }}>
                    <button 
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between py-2 transition-colors" style={{ color: editorial.text }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-300 ${openYears[year] ? 'rotate-90' : ''}`} style={{ color: openYears[year] ? editorial.accent : editorial.subtle }}>
                           <ChevronRight size={14} />
                        </div>
                        <span className={`font-serif italic text-sm ${openYears[year] ? 'font-bold' : ''}`}>{year}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-dashed shadow-sm" style={{ color: editorial.accent, borderColor: editorial.border }}>{books.length}</span>
                    </button>
                    
                    {openYears[year] && (
                      <ul className="mt-1 space-y-1 pb-3 pl-6 animate-in slide-in-from-top-2 duration-300 border-l border-dashed" style={{ borderColor: editorial.border }}>
                        {books.map((b) => (
                          <li key={b.book_name}>
                            <Link href={`/diario/${encodeURIComponent(b.book_name)}`}
                              className={`block text-xs py-1 transition-colors font-serif ${
                                bookName.toLowerCase() === b.book_name.toLowerCase() 
                                ? 'italic font-bold' 
                                : 'hover:opacity-70'
                              }`}
                              style={{ color: bookName.toLowerCase() === b.book_name.toLowerCase() ? editorial.accent : editorial.text }}
                            >
                              {b.book_name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
