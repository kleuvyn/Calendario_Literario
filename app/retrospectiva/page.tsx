"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { BookOpen, Loader2, Star, ArrowLeft, Instagram, Crown, Calendar, ChevronDown, Zap, Clock, X, FileText, Sparkles, Bookmark } from "lucide-react"
import { getReadingData } from "@/lib/api-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { domToPng } from "modern-screenshot"
import { BookFilters, type FilterState } from "@/components/book-filters"
import { RetrospectivaLoadingSkeleton } from "@/components/loading-skeletons"
import { motion, AnimatePresence } from "framer-motion"
import { OptimizedBookCover } from "@/components/optimized-book-cover"
import { EditBookDialog } from "@/components/edit-book-dialog"

const THEMES = {
  rose: { primary: '#f4a6f0', bg: '#fff5f6', text: '#a64d9c', card: '#ffffff' },
  dark: { primary: '#38bdf8', bg: '#f0f7ff', text: '#1e293b', card: '#ffffff' },
  soft: { primary: '#a855f7', bg: '#faf5ff', text: '#5b1c87', card: '#ffffff' },
  coffee: { primary: '#7c3f17', bg: '#fafaf9', text: '#4b3832', card: '#ffffff' },
  ocean: { primary: '#0ea5e9', bg: '#f0f9ff', text: '#0369a1', card: '#ffffff' },
  forest: { primary: '#10b981', bg: '#f0fdf4', text: '#065f46', card: '#ffffff' },
  sunset: { primary: '#f59e0b', bg: '#fffbeb', text: '#92400e', card: '#ffffff' },
  midnight: { primary: '#60a5fa', bg: '#0a0f1f', text: '#ffffff', card: '#1e293b' } 
}

const GENRE_COLORS = ["#ec4899", "#3b82f6", "#a855f7", "#ef4444", "#10b981", "#f59e0b", "#64748b", "#06b6d4"];

const getProxyUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("googleusercontent.com") || url.includes("books.google.com")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace("http://", "https://"))}`;
  }
  return url;
};

export default function RetrospectivaPage() {
  const { data: session, status } = useSession()
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('rose')
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    genres: [],
    ratingMin: null,
    sortBy: 'date'
  })
  const [bookToEdit, setBookToEdit] = useState<any>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeletingBook, setIsDeletingBook] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<string | null>(null)
  
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [selectedCardOption, setSelectedCardOption] = useState<'retrospectiva' | 'biblioteca' | 'a' | 'b' | 'c' | null>('retrospectiva')
  
  const isDarkTheme = currentTheme === 'midnight'
  
  const getThemeCardStyle = () => isDarkTheme
    ? { backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: 'rgba(51, 65, 85, 0.8)' }
    : { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(226, 232, 240, 0.8)' }
  
  const yearsAvailable = useMemo(() => {
    const startYear = 2024;
    const now = new Date().getFullYear();
    const years = [];
    for (let i = now; i >= startYear; i--) {
      years.push(i);
    }
    return years;
  }, []);

  const theme = THEMES[currentTheme]
  const storyResumoRef = useRef<HTMLDivElement>(null)
  const paginasLivrosRef = useRef<(HTMLDivElement | null)[]>([])
  const cardOptionARef = useRef<HTMLDivElement>(null)
  const cardOptionBRef = useRef<HTMLDivElement>(null)
  const cardOptionCRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      if (status === "authenticated" && session?.user?.email) {
        setLoadingData(true)
        try {
          const data: any = await getReadingData(session.user.email, currentYear, true)
          const booksArray = Array.isArray(data) ? data : (data?.data || [])
          setAllBooks(booksArray)

          try {
            const profileRes = await fetch(`/api/user/update-profile?email=${session.user.email}`)
            if (profileRes.ok) {
                const profileData = await profileRes.json()
                if (profileData?.theme && THEMES[profileData.theme as keyof typeof THEMES]) {
                  setCurrentTheme(profileData.theme as keyof typeof THEMES)
                }
            }
          } catch (themeErr) {
          }

        } catch (err) { 
        } finally { 
          setLoadingData(false) 
        }
      } else if (status === "unauthenticated") { 
        setLoadingData(false) 
      }
    }
    loadData()
  }, [status, session, currentYear])

  const filteredBooks = useMemo(() => {
    let result = [...allBooks]
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(book => 
        book.book_name?.toLowerCase().includes(searchLower) ||
        book.author_name?.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters.genres.length > 0) {
      result = result.filter(book => 
        filters.genres.includes(book.genre?.trim() || "Outros")
      )
    }
    
    if (filters.ratingMin !== null) {
      result = result.filter(book => 
        book.rating && book.rating >= filters.ratingMin!
      )
    }
    
    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'pages':
        result.sort((a, b) => (Number(b.total_pages) || 0) - (Number(a.total_pages) || 0))
        break
      case 'title':
        result.sort((a, b) => (a.book_name || '').localeCompare(b.book_name || ''))
        break
      case 'date':
      default:
        result.sort((a, b) => {
          const dateA = new Date(a.end_date || a.start_date || 0).getTime()
          const dateB = new Date(b.end_date || b.start_date || 0).getTime()
          return dateB - dateA
        })
    }
    
    return result
  }, [allBooks, filters])

  const filteredPlannedBooks = useMemo(() => {
    return filteredBooks.filter(b => {
      const status = (b.status || '').toLowerCase()
      return status === 'planejado' || status === 'planned'
    })
  }, [filteredBooks])

  const filteredReadingBooks = useMemo(() => {
    return filteredBooks.filter(b => {
      const status = (b.status || '').toLowerCase()
      return status === 'lendo' || status === 'reading'
    })
  }, [filteredBooks])

  const filteredFinishedBooks = useMemo(() => {
    return filteredBooks.filter(b => {
      const status = (b.status || '').toLowerCase()
      return !['lendo', 'reading', 'planejado', 'planned'].includes(status)
    })
  }, [filteredBooks])

  const libraryBooks = useMemo(() => filteredFinishedBooks, [filteredFinishedBooks])

  const availableGenres = useMemo(() => {
    const genres = new Set<string>()
    allBooks.forEach(book => {
      const genre = book.genre?.trim() || "Outros"
      genres.add(genre)
    })
    return Array.from(genres).sort()
  }, [allBooks])

  const handleThemeChange = async (newTheme: keyof typeof THEMES) => {
    setCurrentTheme(newTheme)
    if (session?.user?.email) {
      try {
        await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email, theme: newTheme })
        })
      } catch (err) { }
    }
  }

  const handleSaveBook = async (data: { newName: string; author: string; pages: number; rating: number; notes: string; cover_url?: string }) => {
    if (!session?.user?.email || !bookToEdit) return
    setIsUpdating(true)
    try {
      await fetch('/api/reading-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_REVIEW',
          email: session.user.email,
          oldBookName: bookToEdit.book_name,
          bookName: data.newName,
          rating: data.rating,
          coverUrl: data.cover_url || bookToEdit.cover_url || '',
          totalPages: data.pages || bookToEdit.total_pages || 0,
          review: data.notes,
          genre: bookToEdit.genre || '',
          year: bookToEdit.year || currentYear,
          month: bookToEdit.month || (new Date(bookToEdit.start_date || Date.now()).getMonth() + 1)
        })
      })
      const updatedData: any = await getReadingData(session.user.email, currentYear, true)
      setAllBooks(Array.isArray(updatedData) ? updatedData : (updatedData?.data || []))
      toast.success('Livro atualizado')
    } catch (err) {
      toast.error('Erro ao salvar')
    } finally {
      setIsUpdating(false)
      setEditDialogOpen(false)
      setBookToEdit(null)
    }
  }

  const bookChunks = useMemo(() => {
    const chunks = []
    const limit = libraryBooks.length <= 40 ? 40 : 100
    for (let i = 0; i < libraryBooks.length; i += limit) {
      chunks.push(libraryBooks.slice(i, i + limit))
    }
    return chunks
  }, [libraryBooks])

  const getGridCols = (count: number) => {
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    if (count <= 25) return 'grid-cols-5';
    if (count <= 40) return 'grid-cols-6';
    if (count <= 70) return 'grid-cols-8';
    return 'grid-cols-10';
  }

  const getBookSizeStyles = (count: number) => {
    if (count <= 9) return { gap: '16px', minWidth: '100%' }; // 3 colunas - maior
    if (count <= 16) return { gap: '12px', minWidth: '100%' }; // 4 colunas
    if (count <= 25) return { gap: '10px', minWidth: '100%' }; // 5 colunas
    if (count <= 40) return { gap: '8px', minWidth: '100%' }; // 6 colunas
    if (count <= 70) return { gap: '6px', minWidth: '100%' }; // 8 colunas
    return { gap: '4px', minWidth: '100%' }; // 10 colunas - menor
  }

  const handleExportAll = async () => {
    setIsGenerating(true)
    try {
      await new Promise(r => setTimeout(r, 1000));

      const downloadEl = async (el: HTMLElement, fileName: string) => {
        const url = await domToPng(el, { 
          scale: 3, 
          quality: 1,
          width: 400, 
          height: 850 
        });
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Se for retrospectiva, exporta só o resumo
      if (selectedCardOption === 'retrospectiva') {
        if (storyResumoRef.current) {
          await downloadEl(storyResumoRef.current, `retrospectiva-${currentYear}.png`);
        }
      }
      // Se for biblioteca, exporta só as páginas de livros
      else if (selectedCardOption === 'biblioteca') {
        for (let i = 0; i < paginasLivrosRef.current.length; i++) {
          const el = paginasLivrosRef.current[i];
          if (el) {
            el.scrollIntoView({ block: 'center' });
            await new Promise(r => setTimeout(r, 500));
            await downloadEl(el, `biblioteca-${i + 1}-${currentYear}.png`);
            await new Promise(r => setTimeout(r, 1500));
          }
        }
      }
    } catch (err: unknown) {
      console.error("Erro ao gerar exportação:", err)
      if (err instanceof Event) {
        alert("Erro ao gerar. Evento de erro detectado. Tente novamente.")
      } else {
        alert("Erro ao gerar. Tente abrir pelo Safari ou Chrome.")
      }
    } finally { 
      setIsGenerating(false); 
    }
  }

  const handleExportCardOption = async () => {
    setIsGenerating(true)
    try {
      if (!selectedCardOption || selectedCardOption === 'retrospectiva' || selectedCardOption === 'biblioteca') {
        throw new Error('Opção inválida para exportar')
      }
      const refs = { a: cardOptionARef, b: cardOptionBRef, c: cardOptionCRef }
      const titles = { a: 'meu-ano-em-livros', b: 'do-calhambaco-ao-flash', c: 'minhas-verdades-literarias' }
      const key = selectedCardOption as 'a' | 'b' | 'c'
      const ref = refs[key]
      const title = titles[key]

      if (ref?.current) {
        const url = await domToPng(ref.current, { 
          scale: 3, 
          quality: 1,
          width: 400, 
          height: 850 
        });
        const link = document.createElement('a');
        link.download = `${title}-${currentYear}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: unknown) {
      console.error("Erro ao gerar exportação (card):", err)
      if (err instanceof Event) {
        alert("Erro ao gerar. Evento de erro detectado. Tente novamente.")
      } else {
        alert("Erro ao gerar. Tente abrir pelo Safari ou Chrome.")
      }
    } finally { 
      setIsGenerating(false); 
    }
  }

  const genreData = useMemo(() => {
    const counts: Record<string, number> = {}
    allBooks.forEach(b => {
      const g = b.genre?.trim() || "Outros";
      counts[g] = (counts[g] || 0) + 1;
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [allBooks])

  const finishedBooksData = useMemo(() => {
    return allBooks.filter(b => {
      const status = (b.status || '').toLowerCase()
      return !['lendo', 'reading', 'planejado', 'planned'].includes(status)
    })
  }, [allBooks])

  const stats = useMemo(() => {
    if (finishedBooksData.length === 0) return null
    const totalPagesYear = finishedBooksData.reduce((acc, b) => acc + (Number(b.total_pages) || 0), 0)
    const topBook = [...finishedBooksData].sort((a, b) => (Number(b.total_pages) || 0) - (Number(a.total_pages) || 0))[0]
    const shortestBook = [...finishedBooksData].filter(b => b.total_pages).sort((a, b) => (Number(a.total_pages) || 0) - (Number(b.total_pages) || 0))[0]
    
    const bestRated = [...finishedBooksData].filter(b => b.rating).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]
    
    const booksWithDays = allBooks
      .filter(b => b.start_date && b.end_date)
      .map(b => {
        const start = new Date(b.start_date)
        const end = new Date(b.end_date)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        return { ...b, readingDays: days }
      })
      .filter(b => b.readingDays > 0)
    
    const fastestBook = booksWithDays.length > 0 
      ? [...booksWithDays].sort((a, b) => a.readingDays - b.readingDays)[0]
      : null
    
    const slowestBook = booksWithDays.length > 0
      ? [...booksWithDays].sort((a, b) => b.readingDays - a.readingDays)[0]
      : null
    
    const monthCounts: Record<number, number> = {}
    allBooks.forEach(b => {
      if (b.end_date) {
        const month = new Date(b.end_date).getMonth()
        monthCounts[month] = (monthCounts[month] || 0) + 1
      }
    })
    const mostProductiveMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    const productiveMonthName = mostProductiveMonth ? monthNames[Number(mostProductiveMonth[0])] : "—"
    const productiveMonthCount = mostProductiveMonth ? mostProductiveMonth[1] : 0
    
    return { 
      totalBooks: allBooks.length, 
      totalPagesYear, 
      topGenre: genreData[0]?.name || "Nenhum", 
      topBook,
      shortestBook,
      bestRated,
      fastestBook,
      slowestBook,
      productiveMonthName,
      productiveMonthCount
    }
  }, [allBooks, genreData])

  if (loadingData) return <RetrospectivaLoadingSkeleton />

  return (
    <div className="min-h-screen pb-16 transition-all duration-700" style={{ background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg}99 50%, ${theme.bg}cc 100%)` }}>
      <div className="max-w-7xl mx-auto p-3 md:p-6 lg:p-10 space-y-8">
        
        <header className="flex flex-col lg:flex-row justify-between items-center gap-5 px-3 backdrop-blur-sm p-5 rounded-xl border shadow-sm transition-all no-export" style={getThemeCardStyle()}>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs font-medium" style={{ color: theme.text }}>
                <ArrowLeft size={14} className="mr-2"/> Voltar
              </Button>
            </Link>
            
            <div className="relative flex items-center bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg px-4 py-2 shadow-xs">
              <Calendar size={14} className="mr-2" style={{ color: theme.primary, opacity: 0.6 }} />
              <select 
                value={currentYear} 
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="appearance-none bg-transparent text-sm font-semibold pr-6 outline-none cursor-pointer"
                style={{ color: theme.text }}
              >
                {yearsAvailable.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 pointer-events-none opacity-50" />
            </div>
          </div>

          <div className="flex backdrop-blur-sm p-1.5 rounded-lg shadow-xs border gap-1 transition-all" style={getThemeCardStyle()}>
            {Object.keys(THEMES).slice(0, 4).map((t) => (
              <button key={t} onClick={() => handleThemeChange(t as any)} className={`p-2 transition-all rounded-md ${currentTheme === t ? isDarkTheme ? 'bg-slate-700 shadow-md scale-105' : 'bg-white shadow-xs scale-105' : 'opacity-50 hover:opacity-75'}`}>
                <BookOpen size={16} color={THEMES[t as keyof typeof THEMES].primary} fill={currentTheme === t ? THEMES[t as keyof typeof THEMES].primary : "transparent"} strokeWidth={1.5} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => {
                if (selectedCardOption === 'retrospectiva') {
                  handleExportAll()
                } else if (selectedCardOption === 'biblioteca') {
                  handleExportAll()
                } else {
                  handleExportCardOption()
                }
              }} 
              disabled={isGenerating || (selectedCardOption === 'retrospectiva' && allBooks.length === 0) || (selectedCardOption === 'biblioteca' && allBooks.length === 0)} 
              className="rounded-lg font-medium text-sm px-6 py-2.5 shadow-sm hover:shadow-md transition-all" 
              style={{ backgroundColor: theme.primary, color: 'white' }}
            >
              {isGenerating ? (
                <Loader2 className="animate-spin" size={14}/>
              ) : (
                <>
                  <Instagram size={14} className="mr-2"/> 
                  Exportar {selectedCardOption === 'retrospectiva' ? 'Retrospectiva' : selectedCardOption === 'biblioteca' ? 'Biblioteca' : 'Story'}
                </>
              )}
            </Button>
            <Link href="/planejados">
              <Button className="rounded-lg font-medium text-sm px-6 py-2.5 shadow-sm hover:shadow-md transition-all" variant="outline">
                <Bookmark size={14} className="mr-2" /> Planejados
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Cards - Destaque das métricas principais */}
        {stats && (
          <div className="space-y-6 no-export">
            {/* LINHA 1: Estatísticas de Impacto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Meta Batida - Total de livros */}
              <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                <div className="flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={14} style={{ color: theme.primary }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.primary }}>
                      Meta Batida
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold" style={{ color: theme.primary }}>
                      {stats.totalBooks}
                    </span>
                    <span className="text-lg font-light" style={{ color: theme.text, opacity: 0.6 }}>
                      {stats.totalBooks === 1 ? 'livro' : 'livros'}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-2" style={{ color: theme.text, opacity: 0.7 }}>
                    lidos em {currentYear}
                  </p>
                </div>
              </div>

              {/* Páginas de uma Vida - Total de páginas */}
              <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                <div className="flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={14} style={{ color: theme.primary }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.primary }}>
                      Páginas de uma Vida
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold" style={{ color: theme.primary }}>
                      {stats.totalPagesYear.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-2" style={{ color: theme.text, opacity: 0.7 }}>
                    páginas exploradas
                  </p>
                </div>
              </div>

              {/* Meu Ritmo Favorito - Gênero mais lido */}
              <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                <div className="flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={14} style={{ color: theme.primary }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.primary }}>
                      Meu Ritmo Favorito
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold" style={{ color: theme.primary }}>
                      {stats.topGenre}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-2" style={{ color: theme.text, opacity: 0.7 }}>
                    gênero preferido
                  </p>
                </div>
              </div>
            </div>

            {/* LINHA 2: Destaques Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pico de Leitura */}
              <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                <div className="flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} style={{ color: theme.primary }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.primary }}>
                      Pico de Leitura
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold" style={{ color: theme.primary }}>
                      {stats.productiveMonthName}
                    </span>
                    <span className="text-lg font-light" style={{ color: theme.text, opacity: 0.6 }}>
                      / {currentYear}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-2" style={{ color: theme.text, opacity: 0.7 }}>
                    {stats.productiveMonthCount} {stats.productiveMonthCount === 1 ? 'livro finalizado' : 'livros finalizados'}
                  </p>
                </div>
              </div>

              {/* Favorito do Ano */}
              <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-24 rounded-lg overflow-hidden shadow-md border-2 border-white shrink-0 relative">
                    <OptimizedBookCover
                      src={getProxyUrl(stats.bestRated?.cover_url)}
                      alt={stats.bestRated?.book_name || ""}
                      fill
                      className=""
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                        Favorito do Ano
                      </span>
                    </div>
                    <h4 className="text-sm font-bold line-clamp-2 mb-1" style={{ color: theme.text }}>
                      {stats.bestRated?.book_name || "Nenhum avaliado"}
                    </h4>
                    {stats.bestRated && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            className={i < (stats.bestRated?.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* O Grande Calhamaço */}
              <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-24 rounded-lg overflow-hidden shadow-md border-2 border-white shrink-0 relative">
                    <OptimizedBookCover
                      src={getProxyUrl(stats.topBook?.cover_url)}
                      alt={stats.topBook?.book_name || ""}
                      fill
                      className=""
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={14} style={{ color: theme.primary }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.primary }}>
                        O Grande Calhamaço
                      </span>
                    </div>
                    <h4 className="text-sm font-bold line-clamp-2 mb-1" style={{ color: theme.text }}>
                      {stats.topBook?.book_name}
                    </h4>
                    <p className="text-xs font-light" style={{ color: theme.text, opacity: 0.6 }}>
                      {Number(stats.topBook?.total_pages || 0).toLocaleString()} páginas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* LINHA 3: Os Extremos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pequena Grande Joia */}
              {stats.shortestBook && (
                <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-24 rounded-lg overflow-hidden shadow-md border-2 border-white shrink-0 relative">
                      <OptimizedBookCover
                        src={getProxyUrl(stats.shortestBook?.cover_url)}
                        alt={stats.shortestBook?.book_name || ""}
                        fill
                        className=""
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={14} className="text-purple-500" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                          Pequena Grande Joia
                        </span>
                      </div>
                      <h4 className="text-sm font-bold line-clamp-2 mb-1" style={{ color: theme.text }}>
                        {stats.shortestBook?.book_name}
                      </h4>
                      <p className="text-xs font-light" style={{ color: theme.text, opacity: 0.6 }}>
                        {Number(stats.shortestBook?.total_pages || 0).toLocaleString()} páginas
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* A Longa Jornada */}
              {stats.slowestBook && (
                <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-24 rounded-lg overflow-hidden shadow-md border-2 border-white shrink-0 relative">
                      <OptimizedBookCover
                        src={getProxyUrl(stats.slowestBook?.cover_url)}
                        alt={stats.slowestBook?.book_name || ""}
                        fill
                        className=""
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-blue-500" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                          A Longa Jornada
                        </span>
                      </div>
                      <h4 className="text-sm font-bold line-clamp-2 mb-1" style={{ color: theme.text }}>
                        {stats.slowestBook?.book_name}
                      </h4>
                      <p className="text-xs font-light" style={{ color: theme.text, opacity: 0.6 }}>
                        {stats.slowestBook?.readingDays} {stats.slowestBook?.readingDays === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Em um Piscar de Olhos */}
              {stats.fastestBook && (
                <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-24 rounded-lg overflow-hidden shadow-md border-2 border-white shrink-0 relative">
                      <OptimizedBookCover
                        src={getProxyUrl(stats.fastestBook?.cover_url)}
                        alt={stats.fastestBook?.book_name || ""}
                        fill
                        className=""
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-emerald-500 fill-emerald-500" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          Em um Piscar de Olhos
                        </span>
                      </div>
                      <h4 className="text-sm font-bold line-clamp-2 mb-1" style={{ color: theme.text }}>
                        {stats.fastestBook?.book_name}
                      </h4>
                      <p className="text-xs font-light" style={{ color: theme.text, opacity: 0.6 }}>
                        {stats.fastestBook?.readingDays} {stats.fastestBook?.readingDays === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botão inicial para escolher formato - Aparece quando nada está selecionado */}
        {stats && !selectedCardOption && (
          <div className="backdrop-blur-sm p-8 rounded-3xl border-2 shadow-xl transition-all no-export text-center relative overflow-hidden"
               style={{
                 ...getThemeCardStyle(),
                 background: isDarkTheme 
                   ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)'
                   : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                 borderColor: `${theme.primary}80`
               }}>
            <div className="absolute inset-0 opacity-5" style={{ 
              backgroundImage: `radial-gradient(circle, ${theme.primary} 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}></div>
            <div className="relative z-10 space-y-6">
              <div className="inline-block p-4 rounded-2xl mb-2" style={{ backgroundColor: `${theme.primary}15` }}>
                <Instagram size={32} style={{ color: theme.primary }} />
              </div>
              <h3 style={{ color: theme.text }} className="text-2xl font-black">
                Escolha como compartilhar
              </h3>
              <p style={{ color: theme.text, opacity: 0.6 }} className="text-sm max-w-md mx-auto mb-6">
                Selecione o formato ideal para suas redes sociais
              </p>
              
              {/* Seção Stories Completos */}
              <div className="space-y-3">
                <h4 style={{ color: theme.text, opacity: 0.8 }} className="text-xs font-bold uppercase tracking-wider">
                  📖 Stories Completos
                </h4>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    onClick={() => setSelectedCardOption('retrospectiva')}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`}
                    style={{ color: theme.text }}
                  >
                    ✨ Resumo do Ano
                  </button>
                  <button
                    onClick={() => setSelectedCardOption('biblioteca')}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`}
                    style={{ color: theme.text }}
                  >
                    📚 Biblioteca Completa
                  </button>
                </div>
              </div>

              {/* Divisor */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: `${theme.text}20` }}></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-4 text-xs font-semibold" style={{ 
                    color: theme.text, 
                    opacity: 0.5,
                    backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.9)' : 'rgba(248, 250, 252, 0.9)'
                  }}>
                    ou
                  </span>
                </div>
              </div>

              {/* Seção Cards Rápidos */}
              <div className="space-y-3">
                <h4 style={{ color: theme.text, opacity: 0.8 }} className="text-xs font-bold uppercase tracking-wider">
                  🎨 Cards Rápidos
                </h4>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    onClick={() => setSelectedCardOption('a')}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`}
                    style={{ color: theme.text }}
                  >
                    📊 Panorama Literário
                  </button>
                  <button
                    onClick={() => setSelectedCardOption('b')}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`}
                    style={{ color: theme.text }}
                  >
                    ⚡ Do Calhamaço ao Flash
                  </button>
                  <button
                    onClick={() => setSelectedCardOption('c')}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`}
                    style={{ color: theme.text }}
                  >
                    💎 Minhas Verdades Literárias
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seletor de Stories para Instagram - Só aparece quando algo está selecionado */}
        {stats && selectedCardOption && (
          <div className="backdrop-blur-sm p-6 rounded-3xl border-2 shadow-2xl transition-all no-export relative overflow-hidden" 
               style={{
                 ...getThemeCardStyle(),
                 background: isDarkTheme 
                   ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                   : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                 borderColor: theme.primary
               }}>
            {/* Decoração de fundo */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: theme.primary }}></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: theme.primary }}></div>
            
            {/* Botão para limpar seleção */}
            <button 
              onClick={() => setSelectedCardOption(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:scale-110 transition-all z-20 opacity-60 hover:opacity-100"
              style={{ backgroundColor: `${theme.text}10` }}
              title="Escolher outro formato"
            >
              <X size={18} style={{ color: theme.text }} />
            </button>
            
            <h3 style={{ color: theme.text }} className="text-xl font-black mb-2 text-center flex items-center justify-center gap-2 relative z-10">
              <span className="text-2xl">📱</span>
              <span>Compartilhe no Instagram</span>
            </h3>
            
            {/* Descrição do formato selecionado */}
            <p style={{ color: theme.text, opacity: 0.6 }} className="text-xs text-center mb-5 relative z-10">
              {selectedCardOption === 'retrospectiva' && '📊 Story completo com estatísticas do ano'}
              {selectedCardOption === 'biblioteca' && '📚 Stories com suas capas de livros'}
              {selectedCardOption === 'a' && '🎯 Card rápido com suas principais métricas'}
              {selectedCardOption === 'b' && '⚡ Card com os extremos de leitura'}
              {selectedCardOption === 'c' && '💎 Card com suas verdades literárias'}
            </p>
            
            <div className="space-y-4 relative z-10">
              {/* Stories Completos */}
              <div>
                <p style={{ color: theme.text, opacity: 0.5 }} className="text-xs font-bold uppercase tracking-widest text-center mb-3">Stories Completos</p>
                <div className="flex flex-wrap gap-3 justify-center pb-4 border-b-2" style={{ borderColor: `${theme.primary}20` }}>
                <button
                  onClick={() => setSelectedCardOption('retrospectiva')}
                  className={`px-6 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${
                    selectedCardOption === 'retrospectiva'
                      ? 'text-white shadow-2xl ring-4 ring-white/20'
                      : `${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`
                  }`}
                  style={{
                    backgroundColor: selectedCardOption === 'retrospectiva' ? theme.primary : undefined,
                    color: selectedCardOption === 'retrospectiva' ? 'white' : theme.text
                  }}
                >
                  📊 Retrospectiva Literária
                </button>
                <button
                  onClick={() => setSelectedCardOption('biblioteca')}
                  className={`px-6 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${
                    selectedCardOption === 'biblioteca'
                      ? 'text-white shadow-2xl ring-4 ring-white/20'
                      : `${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`
                  }`}
                  style={{
                    backgroundColor: selectedCardOption === 'biblioteca' ? theme.primary : undefined,
                    color: selectedCardOption === 'biblioteca' ? 'white' : theme.text
                  }}
                >
                  📚 Minha Biblioteca
                </button>
                </div>
              </div>
              
              {/* Cards Rápidos */}
              <div>
                <p style={{ color: theme.text, opacity: 0.5 }} className="text-xs font-bold uppercase tracking-widest text-center mb-3">Cards Rápidos</p>
                <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setSelectedCardOption('a')}
                  className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${
                    selectedCardOption === 'a'
                      ? 'text-white shadow-2xl ring-4 ring-white/20'
                      : `${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`
                  }`}
                  style={{
                    backgroundColor: selectedCardOption === 'a' ? theme.primary : undefined,
                    color: selectedCardOption === 'a' ? 'white' : theme.text
                  }}
                >
                  🎯 Meu Ano em Livros
                </button>
                <button
                  onClick={() => setSelectedCardOption('b')}
                  className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${
                    selectedCardOption === 'b'
                      ? 'text-white shadow-2xl ring-4 ring-white/20'
                      : `${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`
                  }`}
                  style={{
                    backgroundColor: selectedCardOption === 'b' ? theme.primary : undefined,
                    color: selectedCardOption === 'b' ? 'white' : theme.text
                  }}
                >
                  ⚡ Do Calhamaço ao Flash
                </button>
                <button
                  onClick={() => setSelectedCardOption('c')}
                  className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-xl ${
                    selectedCardOption === 'c'
                      ? 'text-white shadow-2xl ring-4 ring-white/20'
                      : `${isDarkTheme ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-slate-200/50 hover:bg-slate-300'}`
                  }`}
                  style={{
                    backgroundColor: selectedCardOption === 'c' ? theme.primary : undefined,
                    color: selectedCardOption === 'c' ? 'white' : theme.text
                  }}
                >
                  💎 Minhas Verdades Literárias
                </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card A */}
        {stats && selectedCardOption === 'a' && (
          <div 
            ref={cardOptionARef}
            style={{ width: '400px', height: '850px', backgroundColor: theme.bg, margin: '0 auto' }}
            className="px-8 py-6 flex flex-col rounded-[50px] shadow-2xl relative border-2 shrink-0 overflow-hidden"
          >
            {/* Decoração de fundo */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ backgroundColor: theme.primary }}></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: '#f59e0b' }}></div>
            
            <div className="flex flex-col flex-1 relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 rounded-full mb-3" style={{ backgroundColor: `${theme.primary}20` }}>
                  <p style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.3em]">🎯 Meu Ano em Livros</p>
                </div>
                <h1 style={{ color: theme.text, fontFamily: "'Dancing Script', 'Lucida Handwriting', cursive", fontWeight: 700 }} className="text-5xl tracking-tighter">{currentYear}</h1>
              </div>

              {/* Stats Grid */}
              <div className="space-y-4 flex-1">
                {/* Total de Livros - Destaque */}
                <div className="relative rounded-2xl p-6 shadow-lg" style={{ 
                  background: `linear-gradient(135deg, ${theme.primary}20 0%, ${theme.primary}10 100%)`,
                  borderLeft: `4px solid ${theme.primary}`
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: theme.text }} className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Total de Livros</p>
                      <p style={{ color: theme.primary }} className="text-5xl font-black tracking-tight">{stats.totalBooks}</p>
                    </div>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.primary}30` }}>
                      <BookOpen size={28} style={{ color: theme.primary }} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {/* Páginas Total */}
                <div className="relative rounded-2xl p-5 shadow-md" style={{ 
                  background: isDarkTheme ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1" style={{ color: theme.text }}>Páginas Lidas</p>
                  <p className="text-3xl font-black" style={{ color: '#3b82f6' }}>{stats.totalPagesYear.toLocaleString()}</p>
                </div>

                {/* Favorito */}
                {stats.bestRated && (
                  <div className="relative rounded-2xl p-5 shadow-md" style={{ 
                    background: isDarkTheme ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.1)',
                    borderLeft: '4px solid #fb923c'
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#fb923c' }}>Favorito do Ano</p>
                    </div>
                    <p style={{ color: theme.text }} className="text-lg font-bold line-clamp-2">{stats.bestRated.book_name}</p>
                  </div>
                )}

                {/* Gênero */}
                <div className="relative rounded-2xl p-5 shadow-md" style={{ 
                  background: isDarkTheme ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                  borderLeft: '4px solid #10b981'
                }}>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1" style={{ color: theme.text }}>Gênero Favorito</p>
                  <p className="text-xl font-black" style={{ color: '#10b981' }}>{stats.topGenre}</p>
                </div>
              </div>
              
              {/* Logo/Marca */}
              <div className="mt-auto pt-3 text-center border-t-2" style={{ borderColor: `${theme.primary}30` }}>
                <p style={{ color: theme.text, opacity: 0.5 }} className="text-[9px] font-black uppercase tracking-[0.5em]">📚 Calendário Literário</p>
              </div>
            </div>
          </div>
        )}

        {stats && selectedCardOption === 'b' && (
          <div 
            ref={cardOptionBRef}
            style={{ width: '400px', height: '850px', backgroundColor: theme.bg, margin: '0 auto' }}
            className="px-8 py-6 flex flex-col rounded-[50px] shadow-2xl relative border-2 shrink-0 overflow-hidden"
          >
            {/* Padrão de fundo */}
            <div className="absolute inset-0 opacity-5" style={{ 
              backgroundImage: `repeating-linear-gradient(45deg, ${theme.primary} 0px, ${theme.primary} 2px, transparent 2px, transparent 12px)` 
            }}></div>
            
            <div className="flex flex-col flex-1 relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 rounded-full mb-3" style={{ backgroundColor: `${theme.primary}20` }}>
                  <p style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.3em]">⚡ Os Extremos</p>
                </div>
                <h1 style={{ color: theme.text }} className="text-5xl font-black tracking-tighter leading-tight">Do Calhamaço<br/>ao Flash</h1>
              </div>

              <div className="space-y-5 flex-1">
                {/* Maior livro */}
                {stats.topBook && (
                  <div className="relative rounded-3xl p-6 shadow-xl overflow-hidden" style={{ 
                    background: `linear-gradient(135deg, ${theme.primary}25 0%, ${theme.primary}15 100%)` 
                  }}>
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ backgroundColor: theme.primary }}></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                          <BookOpen size={16} className="text-white" strokeWidth={2.5} />
                        </div>
                        <p style={{ color: theme.primary }} className="text-xs font-black uppercase tracking-wider">O Grande Calhamaço</p>
                      </div>
                      <p style={{ color: theme.text }} className="text-xl font-black line-clamp-2 mb-2">{stats.topBook.book_name}</p>
                      <div className="inline-block px-3 py-1.5 rounded-full" style={{ backgroundColor: `${theme.primary}30` }}>
                        <p style={{ color: theme.primary }} className="text-sm font-black">{Number(stats.topBook.total_pages).toLocaleString()} páginas</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menor livro */}
                {stats.shortestBook && (
                  <div className="relative rounded-3xl p-6 shadow-xl overflow-hidden" style={{ 
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' 
                  }}>
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ backgroundColor: '#a855f7' }}></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#a855f7' }}>
                          <BookOpen size={14} className="text-white" strokeWidth={2.5} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#a855f7' }}>Pequena Grande Joia</p>
                      </div>
                      <p style={{ color: theme.text }} className="text-xl font-black line-clamp-2 mb-2">{stats.shortestBook.book_name}</p>
                      <div className="inline-block px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(168, 85, 247, 0.3)' }}>
                        <p className="text-sm font-black" style={{ color: '#a855f7' }}>{Number(stats.shortestBook.total_pages).toLocaleString()} páginas</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mais rápido */}
                {stats.fastestBook && (
                  <div className="relative rounded-3xl p-6 shadow-xl overflow-hidden" style={{ 
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)' 
                  }}>
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ backgroundColor: '#10b981' }}></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
                          <Zap size={16} className="text-white fill-white" strokeWidth={2} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#10b981' }}>Em um Piscar de Olhos</p>
                      </div>
                      <p style={{ color: theme.text }} className="text-xl font-black line-clamp-2 mb-2">{stats.fastestBook.book_name}</p>
                      <div className="inline-block px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }}>
                        <p className="text-sm font-black" style={{ color: '#10b981' }}>{stats.fastestBook.readingDays} {stats.fastestBook.readingDays === 1 ? 'dia' : 'dias'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Logo/Marca */}
              <div className="mt-auto pt-3 text-center border-t-2" style={{ borderColor: `${theme.primary}30` }}>
                <p style={{ color: theme.text, opacity: 0.5 }} className="text-[9px] font-black uppercase tracking-[0.5em]">📚 Calendário Literário</p>
              </div>
            </div>
          </div>
        )}

        {stats && selectedCardOption === 'c' && (
          <div 
            ref={cardOptionCRef}
            style={{ width: '400px', height: '850px', backgroundColor: theme.bg, margin: '0 auto' }}
            className="px-8 py-6 flex flex-col rounded-[50px] shadow-2xl relative border-2 shrink-0 overflow-hidden"
          >
            {/* Decoração de fundo - diamantes */}
            <div className="absolute top-10 right-10 text-6xl opacity-5">💎</div>
            <div className="absolute bottom-20 left-10 text-6xl opacity-5">💎</div>
            <div className="absolute top-1/2 left-1/4 text-4xl opacity-5">✨</div>
            
            <div className="flex flex-col flex-1 relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 rounded-full mb-3" style={{ background: `linear-gradient(135deg, ${theme.primary}30, ${theme.primary}20)` }}>
                  <p style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.3em]">💎 Minhas Verdades</p>
                </div>
                <h1 style={{ color: theme.text, fontFamily: "'Dancing Script', 'Lucida Handwriting', cursive", fontWeight: 700 }} className="text-5xl tracking-tighter">{currentYear}</h1>
              </div>

              <div className="space-y-5 flex-1">
                {/* Favorito - Destaque */}
                {stats.bestRated && (
                  <div className="relative rounded-3xl p-6 shadow-2xl overflow-hidden" style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                  }}>
                    <div className="absolute -top-6 -right-6 text-7xl opacity-20">⭐</div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown size={20} className="text-white fill-white" />
                        <p className="text-xs font-black uppercase tracking-wider text-white">Favorito do Ano</p>
                      </div>
                      <p className="text-2xl font-black text-white line-clamp-2">{stats.bestRated.book_name}</p>
                    </div>
                  </div>
                )}

                {/* Reading streak */}
                {stats.slowestBook && (
                  <div className="relative rounded-3xl p-5 shadow-lg" style={{ 
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)',
                    borderLeft: '5px solid #0ea5e9'
                  }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#0ea5e9' }}>
                        <Clock size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: '#0ea5e9' }}>A Longa Jornada</p>
                        <p style={{ color: theme.text }} className="text-lg font-black line-clamp-2 mb-1">{stats.slowestBook.book_name}</p>
                        <p style={{ color: theme.text, opacity: 0.6 }} className="text-sm font-bold">{stats.slowestBook.readingDays} {stats.slowestBook.readingDays === 1 ? 'dia' : 'dias'} de leitura</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pico de leitura */}
                <div className="relative rounded-3xl p-5 shadow-lg" style={{ 
                  background: `linear-gradient(135deg, ${theme.primary}25 0%, ${theme.primary}15 100%)`,
                  borderLeft: `5px solid ${theme.primary}`
                }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme.primary }}>
                      <Zap size={20} className="text-white fill-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: theme.primary }}>Pico de Leitura</p>
                      <p style={{ color: theme.text }} className="text-2xl font-black">{stats.productiveMonthName}</p>
                      <p style={{ color: theme.text, opacity: 0.6 }} className="text-sm font-bold mt-1">{stats.productiveMonthCount} {stats.productiveMonthCount === 1 ? 'livro' : 'livros'} neste mês</p>
                    </div>
                  </div>
                </div>

                {/* Média de páginas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-4 text-center shadow-md" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1))' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#ec4899' }}>Média</p>
                    <p className="text-2xl font-black" style={{ color: theme.text }}>{Math.round(stats.totalPagesYear / stats.totalBooks)}</p>
                    <p className="text-[10px] opacity-60" style={{ color: theme.text }}>págs/livro</p>
                  </div>
                  <div className="rounded-2xl p-4 text-center shadow-md" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#8b5cf6' }}>Total</p>
                    <p className="text-2xl font-black" style={{ color: theme.text }}>{stats.totalBooks}</p>
                    <p className="text-[10px] opacity-60" style={{ color: theme.text }}>livros</p>
                  </div>
                </div>
              </div>
              
              {/* Logo/Marca */}
              <div className="mt-auto pt-3 text-center border-t-2" style={{ borderColor: `${theme.primary}30` }}>
                <p style={{ color: theme.text, opacity: 0.5 }} className="text-[9px] font-black uppercase tracking-[0.5em]">📚 Calendário Literário</p>
              </div>
            </div>
          </div>
        )}

        {/* Stories - Retrospectiva (apenas resumo) */}
          {allBooks.length > 0 && selectedCardOption === 'retrospectiva' && (
            <div className="flex flex-wrap gap-12 justify-center">
              <div ref={storyResumoRef} style={{ width: '400px', height: '850px', backgroundColor: theme.bg, borderImage: `linear-gradient(135deg, ${theme.primary}40, transparent) 1` }} className="px-8 py-6 flex flex-col rounded-[50px] shadow-2xl relative border-2 shrink-0 overflow-hidden">
                {/* Decoração de fundo */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ backgroundColor: theme.primary }}></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: '#ec4899' }}></div>
                <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-2xl opacity-5" style={{ backgroundColor: '#f59e0b' }}></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="inline-block px-4 py-2 rounded-full mb-3" style={{ backgroundColor: `${theme.primary}20` }}>
                      <p style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.4em]">📊 Retrospectiva Literária</p>
                    </div>
                    <h1 style={{ color: theme.text, fontFamily: "'Dancing Script', 'Lucida Handwriting', cursive", fontWeight: 700 }} className="text-4xl tracking-tighter">{currentYear}</h1>
                  </div>

                  {/* Livro Destaque */}
                  <div className="mb-4 relative">
                    {/* Badge TOP 1 */}
                    <div className="absolute -top-3 -right-3 bg-linear-to-br from-amber-400 to-amber-600 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-20">
                      <Crown size={11} className="fill-white" />
                      TOP 1
                    </div>
                    <div className="rounded-3xl p-4 shadow-xl relative overflow-hidden" style={{ 
                      background: `linear-gradient(135deg, ${theme.primary}40 0%, ${theme.primary}20 100%)`,
                      boxShadow: `0 8px 32px ${theme.primary}30`
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-36 bg-slate-100 rounded-2xl overflow-hidden shadow-2xl transform -rotate-3 border-4 border-white shrink-0 relative" style={{ boxShadow: '0 12px 40px rgba(251, 191, 36, 0.3)' }}>
                          <OptimizedBookCover
                            src={getProxyUrl(stats?.topBook?.cover_url)}
                            alt={stats?.topBook?.book_name || ""}
                            fill
                            className=""
                            priority
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1 rounded-lg bg-amber-500/20">
                              <Crown size={12} className="fill-amber-500 text-amber-500" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: theme.primary }}>Livro Destaque</span>
                          </div>
                          <p style={{ color: theme.text }} className="text-sm font-black leading-tight line-clamp-2 mb-2">{stats?.topBook?.book_name}</p>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${theme.primary}50`, boxShadow: `0 4px 12px ${theme.primary}20` }}>
                            <BookOpen size={10} style={{ color: theme.primary }} />
                            <p className="text-[10px] font-black" style={{ color: theme.primary }}>
                              {Number(stats?.topBook?.total_pages || 0).toLocaleString()} páginas
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats em Cards */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-2xl p-3 text-center shadow-lg relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primary}30, ${theme.primary}15)` }}>
                      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20" style={{ backgroundColor: theme.primary }}></div>
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${theme.primary}20` }}>
                          <BookOpen size={12} style={{ color: theme.primary }} />
                        </div>
                      </div>
                      <p style={{ color: theme.text }} className="text-3xl font-black relative z-10">{stats?.totalBooks}</p>
                      <p className="text-[8px] font-bold uppercase opacity-60 mt-0.5" style={{ color: theme.text }}>Livros</p>
                    </div>
                    <div className="rounded-2xl p-3 text-center shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.15))' }}>
                      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20 bg-blue-400"></div>
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1.5 rounded-lg bg-blue-500/20">
                          <FileText size={12} className="text-blue-500" />
                        </div>
                      </div>
                      <p style={{ color: theme.text }} className="text-2xl font-black leading-tight relative z-10">{stats?.totalPagesYear.toLocaleString()}</p>
                      <p className="text-[8px] font-bold uppercase opacity-60 mt-0.5" style={{ color: theme.text }}>Páginas</p>
                    </div>
                    <div className="rounded-2xl p-3 text-center shadow-lg relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}CC)` }}>
                      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-30 bg-white"></div>
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1.5 rounded-lg bg-white/20">
                          <Sparkles size={12} className="text-white" />
                        </div>
                      </div>
                      <p className="text-white text-sm font-black line-clamp-1 relative z-10">{stats?.topGenre}</p>
                      <p className="text-[8px] font-bold uppercase text-white/70 mt-0.5">Gênero</p>
                    </div>
                  </div>

                  {/* Gráfico de Gêneros */}
                  <div className="flex-1 flex flex-col items-center justify-center min-h-0 pt-4">
                    <div className="h-56 w-full relative px-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={genreData} innerRadius={38} outerRadius={65} paddingAngle={5} dataKey="value" isAnimationActive={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: theme.text, strokeWidth: 1.5, opacity: 0.3 }}>
                            {genreData.map((_, index) => <Cell key={index} fill={GENRE_COLORS[index % GENRE_COLORS.length]} stroke={theme.bg} strokeWidth={3} />)}
                        </Pie></PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 px-2 mt-3">
                      {genreData.slice(0, 9).map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-sm border" style={{ 
                          backgroundColor: `${GENRE_COLORS[index % GENRE_COLORS.length]}15`,
                          borderColor: `${GENRE_COLORS[index % GENRE_COLORS.length]}40`
                        }}>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner" style={{ 
                            backgroundColor: GENRE_COLORS[index % GENRE_COLORS.length],
                            boxShadow: `0 0 8px ${GENRE_COLORS[index % GENRE_COLORS.length]}80`
                          }} />
                          <span style={{ color: theme.text }} className="text-[7.5px] font-black uppercase tracking-tight truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="text-center mt-auto pt-3 border-t-2" style={{ borderColor: `${theme.primary}30` }}>
                    <p style={{ color: theme.text, opacity: 0.5 }} className="text-[9px] font-black uppercase tracking-[0.5em]">📚 Calendário Literário</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Biblioteca - Apenas as páginas de livros */}
          {allBooks.length > 0 && selectedCardOption === 'biblioteca' && (
            <div className="flex flex-wrap gap-12 justify-center">
              {bookChunks.map((chunk, index) => (
                <div key={index} ref={el => { paginasLivrosRef.current[index] = el }} style={{ width: '400px', height: '850px', backgroundColor: theme.bg, borderImage: `linear-gradient(135deg, ${theme.primary}40, transparent) 1` }} className="px-6 py-6 flex flex-col rounded-[50px] shadow-2xl relative border-2 overflow-hidden shrink-0">
                  {/* Decoração de fundo */}
                  <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: theme.primary }}></div>
                  <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10" style={{ backgroundColor: '#10b981' }}></div>
                  <div className="absolute top-20 right-10 w-32 h-32 rounded-full blur-2xl opacity-5" style={{ backgroundColor: '#06b6d4' }}></div>
                  
                  {/* Header */}
                  <div className="text-center mb-4 relative z-10">
                    <div className="inline-block px-4 py-1.5 rounded-full mb-2" style={{ backgroundColor: `${theme.primary}20` }}>
                      <p style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.4em]">📚 Minha Biblioteca</p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <h1 style={{ color: theme.text, fontFamily: "'Dancing Script', 'Lucida Handwriting', cursive", fontWeight: 700 }} className="text-4xl tracking-tighter">{currentYear}</h1>
                      {bookChunks.length > 1 && (
                        <div className="px-3 py-1.5 rounded-full shadow-md" style={{ backgroundColor: `${theme.primary}40`, boxShadow: `0 4px 12px ${theme.primary}20` }}>
                          <p className="text-sm font-black" style={{ color: theme.primary }}>{index + 1}/{bookChunks.length}</p>
                        </div>
                      )}
                    </div>
                    {/* Barra de progresso visual */}
                    {bookChunks.length > 1 && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${theme.text}15` }}>
                          <div className="h-full transition-all duration-500" style={{ width: `${((index + 1) / bookChunks.length) * 100}%`, backgroundColor: theme.primary }}></div>
                        </div>
                        <div className="text-[8px] font-bold" style={{ color: theme.text, opacity: 0.5 }}>{Math.round(((index + 1) / bookChunks.length) * 100)}%</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Stats - apenas na primeira página */}
                  {index === 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3 relative z-10">
                      <div className="rounded-xl p-2 text-center shadow-md" style={{ background: `linear-gradient(135deg, ${theme.primary}25, ${theme.primary}15)` }}>
                        <p style={{ color: theme.text }} className="text-lg font-black">{allBooks.length}</p>
                        <p className="text-[7px] font-bold uppercase opacity-60" style={{ color: theme.text }}>Livros</p>
                      </div>
                      <div className="rounded-xl p-2 text-center shadow-md" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.15))' }}>
                        <p style={{ color: theme.text }} className="text-lg font-black">{stats?.totalPagesYear.toLocaleString()}</p>
                        <p className="text-[7px] font-bold uppercase opacity-60" style={{ color: theme.text }}>Páginas</p>
                      </div>
                    </div>
                  )}
                  
                  
                  {/* Badge de quantidade de livros */}
                  <div className="flex justify-center mb-3 relative z-10">
                    <div className="px-4 py-1.5 rounded-xl shadow-md flex items-center gap-2" style={{ backgroundColor: `${theme.primary}30`, border: `1px solid ${theme.primary}50` }}>
                      <BookOpen size={12} style={{ color: theme.primary }} />
                      <p className="text-[8px] font-black uppercase" style={{ color: theme.primary }}>{chunk.length} livros nesta página</p>
                    </div>
                  </div>
                  
                  {/* Grid de Livros */}
                  <div className={`grid ${getGridCols(chunk.length)} flex-1 content-center items-center px-2 relative z-10`} style={getBookSizeStyles(chunk.length)}>
                    {chunk.map((book, bIdx) => (
                      <div key={bIdx} className="aspect-3/4.5 w-full rounded-lg overflow-hidden bg-white border-2 border-white relative transform transition-all duration-300 group" style={{
                        boxShadow: `0 8px 24px ${theme.primary}00`,
                      }}>
                        <OptimizedBookCover
                          src={getProxyUrl(book.cover_url)}
                          alt={book.book_name}
                          fill
                          className="group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Overlay ao hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex flex-col items-center justify-center p-3 rounded-lg">
                          {/* Título do livro - sempre visível com melhor contraste */}
                          <div className="w-full text-center">
                            <p className="text-white text-[8.5px] font-black line-clamp-3 leading-tight drop-shadow-lg" style={{
                              textShadow: '0 3px 6px rgba(0,0,0,0.9)',
                              WebkitTextStroke: '0.5px rgba(0,0,0,0.3)'
                            }}>{book.book_name}</p>
                          </div>
                        </div>
                        {/* Brilho lateral no hover */}
                        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" style={{
                          background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`,
                          pointerEvents: 'none'
                        }}></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Footer */}
                  <div className="text-center mt-auto pt-3 border-t-2 relative z-10" style={{ borderColor: `${theme.primary}30` }}>
                    <p style={{ color: theme.text, opacity: 0.5 }} className="text-[9px] font-black uppercase tracking-[0.5em]">📚 Calendário Literário</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Biblioteca - Sempre visível quando há livros */}
        {allBooks.length > 0 && (
          <div className="space-y-8 pt-12 px-3 max-w-6xl mx-auto">
            {/* Header da biblioteca */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md p-6 rounded-2xl border-2 shadow-lg relative overflow-hidden transition-all" style={{
                background: isDarkTheme 
                  ? 'linear-gradient(135deg, rgba(26, 31, 53, 0.6) 0%, rgba(26, 31, 53, 0.4) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%)',
                borderColor: isDarkTheme ? 'rgba(45, 58, 82, 0.5)' : 'rgba(255, 255, 255, 0.6)'
              }}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5" style={{ backgroundColor: theme.primary }}></div>
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl shadow-sm" style={{ backgroundColor: `${theme.primary}15` }}>
                      <BookOpen size={18} style={{ color: theme.primary }} strokeWidth={2} />
                    </div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>
                      Minha Biblioteca {currentYear}
                    </h2>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Estante de livros lidos</p>
                  <p className="text-xs font-light" style={{ color: theme.text, opacity: 0.6 }}>Uma coleção de histórias e conhecimentos</p>
                </div>
                <div className="relative z-10">
                  <div className="px-6 py-3 rounded-xl shadow-md text-white font-semibold text-sm flex items-center gap-2" style={{ backgroundColor: theme.primary }}>
                    <BookOpen size={16} strokeWidth={2} />
                    {filteredFinishedBooks.length} {filteredFinishedBooks.length === 1 ? 'livro concluído' : 'livros concluídos'}
                    {filteredReadingBooks.length > 0 && (
                      <span className="text-xs opacity-75 ml-2">+ {filteredReadingBooks.length} em leitura</span>
                    )}
                    {allBooks.length !== filteredFinishedBooks.length && (
                      <span className="text-xs opacity-75">({allBooks.length} no total)</span>
                    )}
                  </div>
                </div>
              </div>

              {filteredPlannedBooks.length > 0 && (
                <Card className="p-4 border border-blue-300 bg-blue-50 rounded-2xl">
                  <h3 className="text-sm font-bold text-blue-700 mb-2">Livros planejados ({filteredPlannedBooks.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredPlannedBooks.map((book) => {
                      return (
                        <div key={book.id || book.book_name} className="border border-blue-200 p-3 rounded-lg bg-white">
                          <p className="text-xs font-bold text-slate-700 truncate">{book.book_name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{book.author_name || 'Autor não informado'}</p>
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" className="font-semibold" onClick={async () => {
                              setIsUpdating(true)
                              try {
                                // se ainda não começou, iniciar leitura hoje
                                const now = new Date()
                                const dateFormatted = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T12:00:00Z`
                                await fetch('/api/reading-data', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: 'START_READING',
                                    email: session?.user?.email,
                                    bookName: book.book_name,
                                    startDate: dateFormatted,
                                    endDate: dateFormatted,
                                    year: now.getFullYear(),
                                    month: now.getMonth()+1,
                                    day: now.getDate()
                                  })
                                })
                                const userEmail = session?.user?.email
                              if (!userEmail) return
                              const data: any = await getReadingData(userEmail, currentYear, true)
                                setAllBooks(Array.isArray(data) ? data : (data?.data || []))
                                toast.success('Livro movido para leitura')
                              } catch (err) {
                                toast.error('Falha ao iniciar leitura')
                              } finally {
                                setIsUpdating(false)
                              }
                            }}>
                              Iniciar leitura
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-600" onClick={() => { setBookToEdit(book); setEditDialogOpen(true); }}>
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" className="text-white" onClick={async () => {
                              if (!window.confirm('Excluir livro planejado?')) return
                              setIsDeletingBook(true)
                              try {
                                await fetch('/api/reading-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'DELETE_READING', email: session?.user?.email, bookName: book.book_name }) })
                                const userEmail = session?.user?.email
                                if (!userEmail) return
                                const data: any = await getReadingData(userEmail, currentYear, true)
                                setAllBooks(Array.isArray(data) ? data : (data?.data || []))
                                toast.success('Livro planejado removido')
                              } catch (err) {
                                toast.error('Erro ao remover')
                              } finally { setIsDeletingBook(false) }
                            }}>
                              Apagar
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {filteredReadingBooks.length > 0 && (
                <Card className="p-4 border border-primary/20 bg-primary/5 rounded-2xl">
                  <h3 className="text-sm font-bold text-primary mb-2">Livros em andamento ({filteredReadingBooks.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredReadingBooks.map((book) => {
                      const start = book.start_date ? new Date(book.start_date) : null
                      const days = start ? Math.max(1, Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))) : '-'
                      return (
                        <div key={book.id || book.book_name} className="border border-primary/30 p-3 rounded-lg bg-white">
                          <p className="text-xs font-bold text-slate-600">{book.book_name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{book.author_name || 'Autor não informado'}</p>
                          <p className="text-[10px] text-primary mt-1">{book.start_date ? `Iniciado há ${days} ${days === 1 ? 'dia' : 'dias'}` : 'Início pendente'}</p>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Grid de estantes - Visual de biblioteca */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`${filters.search}-${filters.genres.join('-')}-${filters.ratingMin}-${filters.sortBy}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-10"
                >
                  {/* Dividir em "estantes" de 6 livros cada */}
                  {Array.from({ length: Math.ceil(filteredBooks.length / 6) }).map((_, shelfIndex) => {
                    const shelfBooks = filteredBooks.slice(shelfIndex * 6, (shelfIndex + 1) * 6)
                    return (
                      <motion.div 
                        key={shelfIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: shelfIndex * 0.1 }}
                        className="rounded-2xl p-6 border-2 shadow-sm relative overflow-hidden transition-all"
                        style={{
                          background: isDarkTheme
                            ? 'linear-gradient(135deg, rgba(45, 58, 82, 0.3) 0%, rgba(26, 31, 53, 0.3) 100%)'
                            : 'linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%)',
                          borderColor: isDarkTheme ? 'rgba(45, 58, 82, 0.4)' : 'rgba(217, 119, 6, 0.2)'
                        }}
                      >
                      {/* Efeito de madeira da estante */}
                      <div className="absolute bottom-0 left-0 right-0 h-3 bg-linear-to-r from-amber-700/20 via-amber-600/15 to-amber-700/20 rounded-b-2xl border-t-2 border-amber-800/10"></div>
                      
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
                          {shelfBooks.map((book, i) => (
                            <motion.div
                              key={book.id || book.book_id || i}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.05 }}
                              className="group"
                            >
                              <div className="relative">
                                {/* Livro */}
                                <div className="aspect-2/3 rounded-lg overflow-hidden shadow-md border-[3px] border-white bg-white transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 relative">
                                  <OptimizedBookCover
                                    src={getProxyUrl(book.cover_url)}
                                    alt={book.book_name}
                                    fill
                                    className=""
                                  />
                                </div>
                                
                                {/* Info do livro */}
                                <div className="mt-3 px-1 space-y-1.5">
                                  <p className="text-xs font-semibold line-clamp-2 leading-tight" style={{ color: theme.text }}>
                                    {book.book_name}
                                  </p>
                                  
                                  {/* Rating - estrelas abaixo do nome */}
                                  {book.rating && (
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          size={11} 
                                          className={i < book.rating ? 'text-amber-400' : 'text-slate-300'}
                                          fill={i < book.rating ? 'currentColor' : 'none'}
                                          strokeWidth={1.5}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-light uppercase tracking-tight" style={{ color: theme.text, opacity: 0.5 }}>
                                      {book.genre || 'Sem gênero'}
                                    </p>
                                    {book.total_pages && (
                                      <p className="text-[9px] font-medium" style={{ color: theme.primary }}>
                                        {book.total_pages}p
                                      </p>
                                    )}
                                  </div>
                                  
                                  {/* Dias de leitura */}
                                  {book.start_date && book.end_date && (
                                    <div className="flex items-center gap-1 pt-0.5">
                                      <Calendar size={9} className="text-slate-400" strokeWidth={2} />
                                      <span className="text-[9px] text-slate-500 font-medium">
                                        {(() => {
                                          const start = new Date(book.start_date)
                                          const end = new Date(book.end_date)
                                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                                          return `${days} ${days === 1 ? 'dia' : 'dias'}`
                                        })()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
        )}

        {/* Mensagem quando não há livros */}
        {allBooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-2xl text-center space-y-4" style={{ borderColor: `${theme.primary}30`, color: theme.text, opacity: 0.4 }}>
             <BookOpen size={40} strokeWidth={1.5} />
             <p className="font-light text-sm">Nenhum livro lido em {currentYear}</p>
          </div>
        )}

        <EditBookDialog
          open={editDialogOpen}
          onClose={() => { setEditDialogOpen(false); setBookToEdit(null)}}
          bookName={bookToEdit?.book_name || ''}
          bookData={{
            author: bookToEdit?.author_name || bookToEdit?.author || '',
            pages: Number(bookToEdit?.total_pages || 0),
            rating: Number(bookToEdit?.rating || 0),
            notes: bookToEdit?.review || '',
            cover_url: bookToEdit?.cover_url || ''
          }}
          onSave={handleSaveBook}
        />

      </div>
    </div>
  )
}