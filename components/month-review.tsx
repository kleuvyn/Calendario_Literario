"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" 
import { 
  Star, Loader2, Trash2, Crown, Trophy, Heart, Zap, Quote, BookOpen, Layers, BarChart3, ChevronDown, Calendar
} from "lucide-react"
import { getReadingData } from "@/lib/api-client"

const GENRE_CATEGORIES = {
  "Ficção e Narrativa": [
    "Romance", "Dark Romance", "Romance de Época", "Chick-Lit", 
    "Fantasia", "Ficção Científica", "Distopia", "Realismo Mágico",
    "Terror / Horror", "Suspense / Thriller", "Policial / Noir",
    "Aventura", "Young Adult (YA)", "Conto / Novela", "Fábula / Apólogo", "Ficção Infantojuvenil"
  ],
  "Não-Ficção": [
    "Biografia / Memórias", "Matemática", "Autoajuda", "Ensaio / Crônica",
    "Filosofia / Sociologia", "Didático / Técnico", "Religioso / Espiritual",
    "Reportagem / Jornalístico", "Gastronomia"
  ],
  "Clássicos e Formatos": [
    "Poesia / Lírico", "Dramático (Teatro)","Conto / Fantástico", "Graphic Novel", 
    "Cordel / Fanfic", "Outro"
  ]
};

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop";

export function MonthReview({ month, userEmail, monthIndex, year }: any) {
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookEdits, setBookEdits] = useState<Record<string, { name: string, cover: string, rating: number, pages: number, review: string, genre: string }>>({})
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState<string | null>(null);

  const isDecember = monthIndex === 11;

  // FUNÇÃO PARA CALCULAR QUANTOS DIAS LEVOU
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    s.setHours(0,0,0,0);
    e.setHours(0,0,0,0);
    const diff = Math.abs(e.getTime() - s.getTime());
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const getBookMonth = (b: any) => {
    if (b.status === 'lido' && b.end_date) {
      const endDate = new Date(b.end_date);
      if (!isNaN(endDate.getTime())) {
        return endDate.getMonth() + 1;
      }
    }
    if (b.start_date) {
      const startDate = new Date(b.start_date);
      if (!isNaN(startDate.getTime())) {
        return startDate.getMonth() + 1;
      }
    }
    return Number(b.month) || 0;
  };

  const loadData = useCallback(async () => {
    if (!userEmail || !year) return
    try {
      setLoading(true)
      const data: any = await getReadingData(userEmail, year)
      const booksArray = Array.isArray(data) ? data : (data?.data || [])
      setAllBooks(booksArray)

      const initialEdits: any = {}
      booksArray.forEach((b: any) => {
        initialEdits[b.id] = {
          name: b.book_name || "",
          cover: b.cover_url || "",
          rating: Number(b.rating) || 0,
          pages: Number(b.total_pages) || 0,
          review: b.review || "",
          genre: b.genre || "" 
        }
      })
      setBookEdits(initialEdits)
    } catch (err) {
      console.error("Erro ao carregar:", err)
    } finally {
      setLoading(false)
    }
  }, [userEmail, year])

  useEffect(() => { loadData() }, [loadData, monthIndex])

  const stats = useMemo(() => {
    const currentMonthBooks = allBooks.filter(b => getBookMonth(b) === (monthIndex + 1));
    const finishedYear = allBooks.filter(b => b.status === 'lido');
    const finishedMonth = currentMonthBooks.filter(b => b.status === 'lido');

    const totalPagesYear = finishedYear.reduce((acc, b) => acc + (Number(b.total_pages) || 0), 0);
    const monthPages = finishedMonth.reduce((acc, b) => {
        const p = Number(bookEdits[b.id]?.pages) || Number(b.total_pages) || 0;
        return acc + p;
    }, 0);
    
    const dayOfYear = Math.max(1, Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000));
    const pagesPerDay = (totalPagesYear / dayOfYear).toFixed(1);

    const yearlyFavs = allBooks.filter(b => Number(bookEdits[b.id]?.rating || b.rating) === 5);
    const favoritesListData = currentMonthBooks.filter(b => Number(bookEdits[b.id]?.rating || b.rating) === 5);

    const biggestBookObj = [...currentMonthBooks]
      .sort((a, b) => (Number(bookEdits[b.id]?.pages || b.total_pages) || 0) - (Number(bookEdits[a.id]?.pages || a.total_pages) || 0))[0];

    return {
      monthTotal: finishedMonth.length,
      monthPages,
      yearTotal: finishedYear.length,
      yearPages: totalPagesYear,
      pagesPerDay,
      favoritesList: favoritesListData,
      biggest: biggestBookObj,
      yearlyFavorites: yearlyFavs
    }
  }, [allBooks, monthIndex, bookEdits])

  const currentMonthBooks = useMemo(() => {
    return allBooks.filter(b => getBookMonth(b) === (monthIndex + 1))
  }, [allBooks, monthIndex])

  const isImageUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return false
    if (/^(data:image\/(?:png|jpe?g|webp|avif|gif);base64,[A-Za-z0-9+/=]+)$/i.test(trimmed)) return true
    return /^(https?:\/\/.*\.(?:png|jpe?g|webp|avif|gif))(\?.*)?$/i.test(trimmed)
  }

  const safeCoverUrl = (url?: string) => {
    if (!url || !url.trim()) return PLACEHOLDER_IMAGE
    return isImageUrl(url) ? url : PLACEHOLDER_IMAGE
  }

  const buscarCapaAutomatica = async (bookId: string, bookName: string) => {
    setIsSearching(bookId);
    const minhaChave = "AIzaSyB5F5pCIBIgZWCIpKwmBvKhh9RTSTwU9tw";
    const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookName)}&key=${minhaChave}&maxResults=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items[0].volumeInfo.imageLinks) {
        let capaUrl = data.items[0].volumeInfo.imageLinks.thumbnail;
        capaUrl = capaUrl.replace("http://", "https://");
        setBookEdits(prev => ({
          ...prev,
          [bookId]: { ...prev[bookId], cover: capaUrl }
        }));
      } else {
        alert("Capa não encontrada.");
      }
    } catch (error) {
      console.error("Erro na API:", error);
    } finally {
      setIsSearching(null);
    }
  };

  const handleSave = async (bookId: string, originalName: string) => {
    setIsSaving(bookId)
    try {
      const data = bookEdits[bookId]
      if (data.cover && !isImageUrl(data.cover)) {
        alert("A URL da capa precisa ser uma imagem (jpg/png/webp/gif). Remova ou use uma imagem direta.")
        return
      }
      await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_REVIEW", 
          email: userEmail, 
          oldBookName: originalName, 
          bookName: data.name,
          rating: Number(data.rating), 
          coverUrl: data.cover,
          totalPages: Number(data.pages), 
          review: data.review,
          genre: data.genre, 
          year: Number(year), 
          month: monthIndex + 1
        }),
      })
      await loadData() 
      alert("Alterações salvas!")
    } catch (err: any) { alert("Erro ao salvar") } finally { setIsSaving(null) }
  }

  const handleDelete = async (bookId: string, bookName: string) => {
    if (!confirm(`Excluir "${bookName}"?`)) return
    setIsDeleting(bookId)
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" })
      if (res.ok) {
        setAllBooks(prev => prev.filter(b => b.id !== bookId))
      }
    } finally { setIsDeleting(null) }
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4 font-sans">
      
      {isDecember && stats.yearlyFavorites.length > 0 && (
        <Card className="p-8 border-none bg-linear-to-br from-amber-500/10 via-white to-primary/5 shadow-xl rounded-[40px]">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-200">
               <Heart className="text-white fill-white" size={24} />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-800">Os Melhores de {year}</h2>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Sua Curadoria de Ouro</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-8 justify-center sm:justify-start">
            {stats.yearlyFavorites.map((fav, i) => (
              <div key={i} className="group relative w-28 sm:w-36 text-center transition-all hover:scale-105">
                <div className="aspect-3/4 rounded-r-xl shadow-[10px_10px_20px_-5px_rgba(0,0,0,0.3)] overflow-hidden border-l-4 border-black/20 mb-3 bg-slate-100 group-hover:border-amber-400 transition-colors">
                  <img 
                    src={safeCoverUrl(bookEdits[fav.id]?.cover || fav.cover_url)} 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                    className="w-full h-full object-cover" 
                    alt="" 
                  />
                </div>
                <p className="text-[10px] font-black uppercase leading-tight truncate px-1 text-slate-700">{bookEdits[fav.id]?.name || fav.book_name}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-8 bg-white border-slate-100 shadow-sm rounded-[30px]">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
               <Layers size={18} />
            </div>
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Performance: {month}</p>
          </div>
          <div className="flex items-center gap-5 text-right">
             <div className="hidden sm:block">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Progresso Anual</p>
                <p className="text-sm font-black text-slate-600 italic">{stats.yearTotal} LIVROS / {stats.yearPages} PÁGS</p>
             </div>
             <BarChart3 size={24} className="text-slate-200" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center border-r border-slate-100 py-4">
            <p className="text-7xl font-black text-slate-800 tracking-tighter leading-none">{stats.monthTotal}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-3 tracking-[0.2em]">Lidos no Mês</p>
          </div>
          <div className="text-center py-4">
            <p className="text-7xl font-black text-slate-800 tracking-tighter leading-none">{stats.monthPages}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-3 tracking-[0.2em]">Páginas no Mês</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-12">
        {currentMonthBooks.map((book, idx) => {
          const isFav = Number(bookEdits[book.id]?.rating || book.rating) === 5;
          const currentCover = bookEdits[book.id]?.cover || book.cover_url || PLACEHOLDER_IMAGE;
          const daysRead = calculateDays(book.start_date, book.end_date);

          return (
            <Card key={book.id} className={`flex flex-col shadow-2xl rounded-[40px] transition-all border-none p-6 gap-6 ${isFav ? 'bg-amber-50/30' : 'bg-white'}`}>
              
              <div className="flex justify-between items-start gap-6">
                <div className="flex gap-3 shrink-0 pt-1">
                  <button onClick={() => handleDelete(book.id, book.book_name)} className="text-slate-200 hover:text-red-500 transition-colors p-2 bg-slate-50 rounded-xl hover:bg-red-50">
                    {isDeleting === book.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20}/>}
                  </button>
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Título do Livro</p>
                  <Input 
                    className="h-auto font-black text-2xl uppercase text-slate-800 italic border-none bg-transparent p-0 focus-visible:ring-0 rounded-none" 
                    value={bookEdits[book.id]?.name || ""}
                    onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], name: e.target.value}}))}
                  />
                  
                  {/* GÊNERO E DIAS DE LEITURA JUNTOS */}
                  <div className="flex flex-wrap items-center gap-4">
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{bookEdits[book.id]?.genre || "Sem gênero definido"}</p>
                    
                    {daysRead !== null && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                        <Calendar size={10} className="text-slate-500" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                          Tempo: {daysRead} {daysRead === 1 ? 'Dia' : 'Dias'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="relative shrink-0 flex flex-col justify-start items-center">
                  <div className="w-47.5 sm:w-55 aspect-[3/4.2] relative group">
                    <div className="w-full h-full rounded-r-xl overflow-hidden shadow-[20px_20px_40px_-15px_rgba(0,0,0,0.4)] border-l-[6px] border-black/30 bg-slate-200 transition-transform duration-500 group-hover:scale-[1.02]">
                      <img 
                        src={safeCoverUrl(currentCover)} 
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                        className="w-full h-full object-cover" 
                        alt="capa" 
                      />
                      <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-r from-white/10 to-transparent" />
                    </div>
                    {isFav && (
                      <div className="absolute -top-3 -left-3 bg-amber-500 text-white p-3 rounded-2xl shadow-xl z-10">
                        <Crown size={20} fill="white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 w-47.5 sm:w-55 px-5 py-4 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 shadow-2xl border border-slate-600">
                    <p className="text-white text-center font-black text-base leading-tight line-clamp-3" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.95)' }}>
                      {bookEdits[book.id]?.name || book.book_name}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                    <div className="space-y-5">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex justify-between items-center">
                            URL da Capa
                            <button 
                              type="button" 
                              onClick={() => buscarCapaAutomatica(book.id, bookEdits[book.id]?.name)}
                              disabled={isSearching === book.id}
                              className="text-primary font-black text-[8px] flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md"
                            >
                              <Zap size={10} className="fill-current" /> AUTO
                            </button>
                          </p>
                          <Input className="h-10 text-[11px] bg-slate-50 border-none rounded-xl" value={bookEdits[book.id]?.cover || ""} onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], cover: e.target.value}}))} />
                        </div>
                        <div className="w-24">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Págs</p>
                          <Input type="number" className="h-10 text-sm bg-slate-50 border-none rounded-xl font-black" value={bookEdits[book.id]?.pages || ""} onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], pages: Number(e.target.value)}}))} />
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Gênero Literário</p>
                        <div className="relative">
                          <select 
                            className="w-full h-10 text-[11px] font-black bg-slate-50 border-none rounded-xl px-4 appearance-none uppercase text-slate-600"
                            value={bookEdits[book.id]?.genre || ""}
                            onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], genre: e.target.value}}))}
                          >
                            <option value="">Escolher Gênero...</option>
                            {Object.entries(GENRE_CATEGORIES).map(([category, genres]) => (
                              <optgroup key={category} label={category}>
                                {genres.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><Quote size={10} /> Review</p>
                      <Textarea 
                        className="text-xs bg-slate-50 border-none resize-none h-full min-h-[140px] rounded-2xl p-4"
                        value={bookEdits[book.id]?.review || ""}
                        onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], review: e.target.value}}))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-center lg:items-end mt-auto">
                    {/* LEITURA RÁPIDA (ZAP) */}
                    {daysRead && daysRead <= 2 && (
                      <div className="flex items-center gap-2 text-orange-500 bg-orange-50 px-4 py-2 rounded-xl mb-4 self-center lg:self-end">
                        <Zap size={14} fill="currentColor" />
                        <span className="text-[9px] font-black uppercase">Leitura Recorde!</span>
                      </div>
                    )}

                    <div className="flex gap-2 bg-slate-50 p-4 rounded-[20px] self-center lg:self-end">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={28} className={`cursor-pointer transition-all ${s <= (bookEdits[book.id]?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} onClick={() => setBookEdits(p => ({...p, [book.id]: {...p[book.id], rating: s}}))} />
                      ))}
                    </div>
                    <Button 
                      className="w-full lg:w-64 h-14 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl mt-4" 
                      onClick={() => handleSave(book.id, book.book_name)} 
                      disabled={isSaving === book.id}
                    >
                      {isSaving === book.id ? "Salvando..." : "Salvar Review"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}