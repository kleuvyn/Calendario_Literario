"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { BookOpen, Loader2, Star, ArrowLeft, Instagram, Crown, Calendar, ChevronDown } from "lucide-react"
import { getReadingData } from "@/lib/api-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { domToPng } from "modern-screenshot"

const THEMES = {
  rose: { primary: '#f4a6f0', bg: '#fff5f6', text: '#a64d9c', card: '#ffffff' },
  dark: { primary: '#38bdf8', bg: '#f0f7ff', text: '#1e293b', card: '#ffffff' },
  soft: { primary: '#a855f7', bg: '#faf5ff', text: '#5b1c87', card: '#ffffff' },
  coffee: { primary: '#7c3f17', bg: '#fafaf9', text: '#4b3832', card: '#ffffff' },
  ocean: { primary: '#0ea5e9', bg: '#f0f9ff', text: '#0369a1', card: '#ffffff' },
  forest: { primary: '#10b981', bg: '#f0fdf4', text: '#065f46', card: '#ffffff' },
  sunset: { primary: '#f59e0b', bg: '#fffbeb', text: '#92400e', card: '#ffffff' },
  midnight: { primary: '#818cf8', bg: '#0f172a', text: '#f8fafc', card: '#1e293b' } 
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
  
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  
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
            console.warn("Aviso: Não foi possível carregar o tema personalizado, usando padrão.");
          }

        } catch (err) { 
          console.error("Erro ao carregar dados dos livros:", err) 
        } finally { 
          setLoadingData(false) 
        }
      } else if (status === "unauthenticated") { 
        setLoadingData(false) 
      }
    }
    loadData()
  }, [status, session, currentYear])

  const handleThemeChange = async (newTheme: keyof typeof THEMES) => {
    setCurrentTheme(newTheme)
    if (session?.user?.email) {
      try {
        await fetch('/api/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email, theme: newTheme })
        })
      } catch (err) { console.error("Erro ao salvar tema:", err) }
    }
  }

  const bookChunks = useMemo(() => {
    const chunks = []
    const limit = allBooks.length <= 40 ? 40 : 100
    for (let i = 0; i < allBooks.length; i += limit) {
      chunks.push(allBooks.slice(i, i + limit))
    }
    return chunks
  }, [allBooks])

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
    allBooks.forEach(b => { const g = b.genre?.trim() || "Outros"; counts[g] = (counts[g] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
  }, [allBooks])

  const stats = useMemo(() => {
    if (allBooks.length === 0) return null
    const totalPagesYear = allBooks.reduce((acc, b) => acc + (Number(b.total_pages) || 0), 0)
    const topBook = [...allBooks].sort((a, b) => (Number(b.total_pages) || 0) - (Number(a.total_pages) || 0))[0]
    return { totalBooks: allBooks.length, totalPagesYear, topGenre: genreData[0]?.name || "Nenhum", topBook }
  }, [allBooks, genreData])

  if (loadingData) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-rose-500" /></div>

  return (
    <div className="min-h-screen bg-slate-50 pb-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto p-4 space-y-12">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 px-4 no-export">
          <div className="flex items-center gap-4">
            <Link href="/"><Button variant="ghost" className="text-[10px] font-black uppercase"><ArrowLeft size={14} className="mr-2"/> Voltar</Button></Link>
            
            <div className="relative flex items-center bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm">
              <Calendar size={12} className="mr-2 text-slate-400" />
              <select 
                value={currentYear} 
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="appearance-none bg-transparent text-[11px] font-black uppercase pr-6 outline-none cursor-pointer"
                style={{ color: theme.text }}
              >
                {yearsAvailable.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={10} className="absolute right-3 pointer-events-none opacity-50" />
            </div>
          </div>

          <div className="flex bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm border border-slate-200 gap-2">
            {Object.keys(THEMES).map((t) => (
              <button key={t} onClick={() => handleThemeChange(t as any)} className={`p-2 transition-all rounded-full ${currentTheme === t ? 'bg-slate-100 scale-110' : 'opacity-30'}`}>
                <BookOpen size={22} color={THEMES[t as keyof typeof THEMES].primary} fill={currentTheme === t ? THEMES[t as keyof typeof THEMES].primary : "transparent"} />
              </button>
            ))}
          </div>

          <Button onClick={handleExportAll} disabled={isGenerating || allBooks.length === 0} className="bg-slate-900 text-white rounded-full font-black uppercase text-[10px] px-8 h-11 hover:bg-black transition-all shadow-lg active:scale-95">
            {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <><Instagram size={14} className="mr-2"/> Exportar Stories</>}
          </Button>
        </header>

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
                    <div className="w-20 h-32 bg-slate-100 rounded-xl overflow-hidden shadow-xl transform -rotate-1 border border-black/5">
                        <img src={getProxyUrl(stats?.topBook?.cover_url)} className="w-full h-full object-cover" crossOrigin="anonymous" alt="" />
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
                <div className="text-center mt-6 pb-2 opacity-20" style={{ color: theme.text }}><p className="text-[8px] font-black uppercase tracking-[0.5em]">estante-literaria.vercel.app</p></div>
              </div>

              {bookChunks.map((chunk, index) => (
                <div key={index} ref={el => { paginasLivrosRef.current[index] = el }} style={{ width: '400px', height: '850px', backgroundColor: theme.bg }} className="px-4 py-12 flex flex-col rounded-[50px] shadow-2xl relative border border-black/5 overflow-hidden shrink-0">
                  <div className="text-center mb-10 pt-4 px-4">
                     <p style={{ color: theme.primary }} className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-80">Minha Biblioteca</p>
                     <h1 style={{ color: theme.text }} className="text-4xl font-black uppercase italic tracking-tighter leading-none">{currentYear} {bookChunks.length > 1 ? `(${index + 1}/${bookChunks.length})` : ''}</h1>
                  </div>
                  <div className={`grid ${getGridCols(chunk.length)} gap-2 flex-1 content-center items-center px-2`}>
                    {chunk.map((book, bIdx) => (
                      <div key={bIdx} className="aspect-[3/4.5] w-full rounded-sm shadow-sm overflow-hidden bg-white border border-black/5">
                        <img src={getProxyUrl(book.cover_url)} className="w-full h-full object-cover" crossOrigin="anonymous" alt="" />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-10 pb-4 opacity-30 px-4" style={{ color: theme.text }}><p className="text-[9px] font-black uppercase tracking-[0.6em]">estante-literaria.vercel.app</p></div>
                </div>
              ))}
            </div>

            <div className="space-y-10 pt-16 border-t border-slate-200 px-4 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xs font-black uppercase text-slate-400 flex items-center gap-3 tracking-[0.4em]">
                    <Calendar size={18} className="text-slate-300" /> Sua Biblioteca {currentYear}
                  </h2>
                  <p className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">Todos os livros lidos</p>
                </div>
                <span className="bg-slate-900 text-white text-[11px] font-black px-6 py-2 rounded-full uppercase shadow-lg">
                  {allBooks.length} Livros Lidos
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 pb-20">
                {allBooks.map((book, i) => (
                  <Link href={`/livro/${book.id || book.book_id}`} key={i} className="group cursor-pointer">
                    <div className="aspect-2/3 rounded-[28px] overflow-hidden shadow-md border-[6px] border-white bg-white transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-3 group-hover:rotate-2 relative">
                      <img src={getProxyUrl(book.cover_url) || "https://via.placeholder.com/300x450"} className="w-full h-full object-cover" alt={book.book_name} />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-4 px-2">
                      <p className="text-[11px] font-black uppercase text-slate-800 line-clamp-1 tracking-tight group-hover:text-rose-500 transition-colors">{book.book_name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{book.genre}</p>
                        <div className="flex items-center gap-1 text-amber-400">
                           <Star size={8} fill="currentColor" />
                           <span className="text-[9px] font-black">{book.rating || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border-4 border-dashed border-slate-200 rounded-[60px] text-slate-300 text-center space-y-4">
             <BookOpen size={48} className="opacity-20" />
             <p className="font-black uppercase text-sm tracking-[0.5em]">Nenhum livro lido em {currentYear}</p>
          </div>
        )}
      </div>
    </div>
  )
}