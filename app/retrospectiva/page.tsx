"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { BookOpen, Loader2, Star, ArrowLeft, Instagram, Crown, Calendar, ChevronDown } from "lucide-react"
import { getReadingData } from "@/lib/api-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { domToPng } from "modern-screenshot"
import { BookFilters, type FilterState } from "@/components/book-filters"
import { RetrospectivaLoadingSkeleton } from "@/components/loading-skeletons"
import { motion, AnimatePresence } from "framer-motion"
import { OptimizedBookCover } from "@/components/optimized-book-cover"

const THEMES = {
  rose: { primary: '#f4a6f0', bg: '#fff5f6', text: '#a64d9c', card: '#ffffff' },
  dark: { primary: '#38bdf8', bg: '#f0f7ff', text: '#1e293b', card: '#ffffff' },
  soft: { primary: '#a855f7', bg: '#faf5ff', text: '#5b1c87', card: '#ffffff' },
  coffee: { primary: '#7c3f17', bg: '#fafaf9', text: '#4b3832', card: '#ffffff' },
  ocean: { primary: '#0ea5e9', bg: '#f0f9ff', text: '#0369a1', card: '#ffffff' },
  forest: { primary: '#10b981', bg: '#f0fdf4', text: '#065f46', card: '#ffffff' },
  sunset: { primary: '#f59e0b', bg: '#fffbeb', text: '#92400e', card: '#ffffff' },
  midnight: { primary: '#60a5fa', bg: '#0a0f1f', text: '#e2e8f0', card: '#1a1f35' } 
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
  
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  
  const isDarkTheme = currentTheme === 'midnight'
  
  const getThemeCardStyle = () => isDarkTheme
    ? { backgroundColor: 'rgba(26, 31, 53, 0.4)', borderColor: 'rgba(45, 58, 82, 0.5)' }
    : { backgroundColor: 'rgba(255, 255, 255, 0.4)', borderColor: 'rgba(255, 255, 255, 0.5)' }
  
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

  useEffect(() => {
    async function loadData() {
      if (status === "authenticated" && session?.user?.email) {
        setLoadingData(true)
        try {
          const data: any = await getReadingData(session.user.email, currentYear, true)
          const booksArray = Array.isArray(data) ? data : (data?.data || [])
          setAllBooks(booksArray.filter((b: any) => b.status !== 'lendo' && b.status !== 'reading'))

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

  const bookChunks = useMemo(() => {
    const chunks = []
    const limit = filteredBooks.length <= 40 ? 40 : 100
    for (let i = 0; i < filteredBooks.length; i += limit) {
      chunks.push(filteredBooks.slice(i, i + limit))
    }
    return chunks
  }, [filteredBooks])

  const getGridCols = (count: number) => {
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    if (count <= 25) return 'grid-cols-5';
    if (count <= 40) return 'grid-cols-6';
    if (count <= 70) return 'grid-cols-8';
    return 'grid-cols-10';
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

      if (storyResumoRef.current) {
        await downloadEl(storyResumoRef.current, `01-resumo-${currentYear}.png`);
      }

      await new Promise(r => setTimeout(r, 1500));

      for (let i = 0; i < paginasLivrosRef.current.length; i++) {
        const el = paginasLivrosRef.current[i];
        if (el) {
          el.scrollIntoView({ block: 'center' });
          await new Promise(r => setTimeout(r, 500));
          await downloadEl(el, `0${i + 2}-biblioteca-${i + 1}.png`);
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    } catch (err) {
      alert("Erro ao gerar. Tente abrir pelo Safari ou Chrome.");
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

  const stats = useMemo(() => {
    if (allBooks.length === 0) return null
    const totalPagesYear = allBooks.reduce((acc, b) => acc + (Number(b.total_pages) || 0), 0)
    const topBook = [...allBooks].sort((a, b) => (Number(b.total_pages) || 0) - (Number(a.total_pages) || 0))[0]
    
    const bestRated = [...allBooks].filter(b => b.rating).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]
    
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
      bestRated,
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

          <Button onClick={handleExportAll} disabled={isGenerating || allBooks.length === 0} className="rounded-lg font-medium text-sm px-6 py-2.5 shadow-sm hover:shadow-md transition-all" style={{ backgroundColor: theme.primary, color: 'white' }}>
            {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <><Instagram size={14} className="mr-2"/> Exportar</>}
          </Button>
        </header>

        {/* Filtros de busca */}
        <div className="backdrop-blur-sm rounded-xl p-4 border shadow-sm transition-all no-export" style={getThemeCardStyle()}>
          <BookFilters 
            onFilterChangeAction={setFilters}
            availableGenres={availableGenres}
          />
        </div>

        {/* Stats Cards - Destaque das métricas principais */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-export">
            {/* Livro mais longo */}
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
                      Mais Longo
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

            {/* Melhor avaliado */}
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
                      Melhor Avaliado
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

            {/* Mês mais produtivo */}
            <div className="backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all" style={getThemeCardStyle()}>
              <div className="flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} style={{ color: theme.primary }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.primary }}>
                    Mês Mais Produtivo
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
          </div>
        )}

        {allBooks.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-12 justify-center">
              <div ref={storyResumoRef} style={{ width: '400px', height: '850px', backgroundColor: theme.bg }} className="px-6 py-8 flex flex-col rounded-[50px] shadow-2xl relative border border-black/5 shrink-0 overflow-hidden">
                <div className="text-center mb-6 pt-2">
                   <p style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">Retrospectiva Literária</p>
                   <h1 style={{ color: theme.text }} className="text-5xl font-black uppercase italic tracking-tighter leading-none">{currentYear}</h1>
                </div>

                <Link href={`/livro/${stats?.topBook?.id || stats?.topBook?.book_id}`} className="block transition-transform hover:scale-[1.02] active:scale-95">
                  <div style={{ backgroundColor: theme.card }} className="p-5 rounded-[40px] shadow-sm flex flex-col items-center text-center gap-3 border border-black/5 mx-1 mb-6">
                    <div className="w-20 h-32 bg-slate-100 rounded-xl overflow-hidden shadow-xl transform -rotate-1 border border-black/5 relative">
                        <OptimizedBookCover
                          src={getProxyUrl(stats?.topBook?.cover_url)}
                          alt={stats?.topBook?.book_name || ""}
                          fill
                          className=""
                          priority
                        />
                    </div>
                    <div className="space-y-1 w-full px-2">
                        <div className="flex items-center justify-center gap-1.5" style={{ color: theme.primary }}><Crown size={12} fill="currentColor" /><span className="text-[8px] font-black uppercase tracking-widest">Destaque do Ano</span></div>
                        <p style={{ color: theme.text }} className="text-[13px] font-black uppercase leading-tight line-clamp-2 italic mb-1">{stats?.topBook?.book_name}</p>
                        <p className="text-[9px] font-black uppercase opacity-30 tracking-widest" style={{ color: theme.text }}>
                          {Number(stats?.topBook?.total_pages || 0).toLocaleString()} Páginas
                        </p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center justify-between gap-1 mb-8 px-4 text-center">
                  <div><span style={{ color: theme.text }} className="text-3xl font-black tracking-tighter leading-none">{stats?.totalBooks}</span><p className="text-[7px] font-black uppercase opacity-40 mt-1">Lidos</p></div>
                  <div className="px-4"><div style={{ backgroundColor: theme.primary }} className="py-2 px-4 rounded-2xl shadow-md text-white text-[9px] font-black uppercase truncate leading-none">{stats?.topGenre}</div><p className="text-[7px] font-black uppercase opacity-40 mt-1">Favorito</p></div>
                  <div><span style={{ color: theme.text }} className="text-2xl font-black tracking-tighter leading-none">{stats?.totalPagesYear.toLocaleString()}</span><p className="text-[7px] font-black uppercase opacity-40 mt-1">Págs no ano</p></div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={genreData} innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" isAnimationActive={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: theme.text, strokeWidth: 1.5, opacity: 0.2 }}>
                          {genreData.map((_, index) => <Cell key={index} fill={GENRE_COLORS[index % GENRE_COLORS.length]} stroke={theme.bg} strokeWidth={2} />)}
                      </Pie></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 px-2 mt-4">
                    {genreData.slice(0, 8).map((item, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: GENRE_COLORS[index % GENRE_COLORS.length] }} />
                        <span style={{ color: theme.text }} className="text-[7px] font-black uppercase tracking-tight opacity-60">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center mt-6 pb-2 opacity-20" style={{ color: theme.text }}><p className="text-[8px] font-black uppercase tracking-[0.5em]">Estante Literária</p></div>
              </div>

              {bookChunks.map((chunk, index) => (
                <div key={index} ref={el => { paginasLivrosRef.current[index] = el }} style={{ width: '400px', height: '850px', backgroundColor: theme.bg }} className="px-4 py-12 flex flex-col rounded-[50px] shadow-2xl relative border border-black/5 overflow-hidden shrink-0">
                  <div className="text-center mb-10 pt-4 px-4">
                     <p style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-80">Minha Biblioteca</p>
                     <h1 style={{ color: theme.text }} className="text-4xl font-black uppercase italic tracking-tighter leading-none">{currentYear} {bookChunks.length > 1 ? `(${index + 1}/${bookChunks.length})` : ''}</h1>
                  </div>
                  <div className={`grid ${getGridCols(chunk.length)} gap-2 flex-1 content-center items-center px-2`}>
                    {chunk.map((book, bIdx) => (
                      <div key={bIdx} className="aspect-3/4.5 w-full rounded-sm shadow-sm overflow-hidden bg-white border border-black/5 relative">
                        <OptimizedBookCover
                          src={getProxyUrl(book.cover_url)}
                          alt={book.book_name}
                          fill
                          className=""
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-10 pb-4 opacity-30 px-4" style={{ color: theme.text }}><p className="text-[9px] font-black uppercase tracking-[0.6em]">Estante Literária</p></div>
                </div>
              ))}
            </div>

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
                    {filteredBooks.length} {filteredBooks.length === 1 ? 'livro' : 'livros'}
                    {filteredBooks.length !== allBooks.length && (
                      <span className="text-xs opacity-75">({allBooks.length} total)</span>
                    )}
                  </div>
                </div>
              </div>
              
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
                            >
                              <Link href={`/livro/${book.id || book.book_id}`} className="group cursor-pointer block">
                                <div className="relative">
                              {/* Livro */}
                              <div className="aspect-2/3 rounded-lg overflow-hidden shadow-md border-[3px] border-white bg-white transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-3 group-hover:rotate-1 relative">
                                <OptimizedBookCover
                                  src={getProxyUrl(book.cover_url)}
                                  alt={book.book_name}
                                  fill
                                  className=""
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                

                              </div>
                              
                              {/* Info do livro */}
                              <div className="mt-3 px-1 space-y-1.5">
                                <p className="text-xs font-semibold line-clamp-2 leading-tight transition-colors group-hover:text-opacity-80" style={{ color: theme.text }}>
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
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-2xl text-center space-y-4" style={{ borderColor: `${theme.primary}30`, color: theme.text, opacity: 0.4 }}>
             <BookOpen size={40} strokeWidth={1.5} />
             <p className="font-light text-sm">Nenhum livro lido em {currentYear}</p>
          </div>
        )}
      </div>
    </div>
  )
}