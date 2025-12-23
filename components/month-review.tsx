"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" 
import { 
  Star, Loader2, Trash2, Crown, Trophy, Heart, Zap, Quote, BookOpen, Layers, BarChart3
} from "lucide-react"
import { getReadingData } from "@/lib/api-client"

const GENRES = [
  "Filosofia", "Matemática", "Técnico", "Romance", 
  "Suspense", "Fantasia", "Terror", "Biografia", 
  "Ficção", "Não-Ficção", "Autoajuda", "Outro"
];

// Imagem estável para evitar o erro de console src=""
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop";

export function MonthReview({ month, userEmail, monthIndex, year }: any) {
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookEdits, setBookEdits] = useState<Record<string, { cover: string, rating: number, pages: number, review: string, genre: string }>>({})
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const isDecember = monthIndex === 11;

  const loadData = useCallback(async () => {
    if (!userEmail || !year) return
    try {
      setLoading(true)
      const data: any = await getReadingData(userEmail, year)
      const booksArray = Array.isArray(data) ? data : (data?.data || [])
      setAllBooks(booksArray)

      const initialEdits: any = {}
      booksArray.forEach((b: any) => {
        initialEdits[b.book_name] = {
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

  // LÓGICA DE ESTATÍSTICAS CORRIGIDA (Soma os 5 livros e as páginas)
  const stats = useMemo(() => {
    const currentMonthBooks = allBooks.filter(b => Number(b.month) === (monthIndex + 1));
    
    // Consideramos lido tudo que não é 'lendo', para aceitar 'finalizado' e 'lido'
    const finishedYear = allBooks.filter(b => b.status !== 'lendo');
    const finishedMonth = currentMonthBooks.filter(b => b.status !== 'lendo');

    // Soma as páginas garantindo conversão numérica
    const totalPagesYear = finishedYear.reduce((acc, b) => acc + (Number(b.total_pages) || 0), 0);
    const monthPages = finishedMonth.reduce((acc, b) => {
        // Pega do estado de edição ou do banco
        const p = Number(bookEdits[b.book_name]?.pages) || Number(b.total_pages) || 0;
        return acc + p;
    }, 0);
    
    const dayOfYear = Math.max(1, Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000));
    const pagesPerDay = (totalPagesYear / dayOfYear).toFixed(1);

    const yearlyFavs = allBooks.filter(b => Number(bookEdits[b.book_name]?.rating || b.rating) === 5);
    const favoritesListData = currentMonthBooks.filter(b => Number(bookEdits[b.book_name]?.rating || b.rating) === 5);

    const biggestBookObj = [...currentMonthBooks]
      .sort((a, b) => (Number(bookEdits[b.book_name]?.pages || b.total_pages) || 0) - (Number(bookEdits[a.book_name]?.pages || a.total_pages) || 0))[0];

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
    return allBooks.filter(b => Number(b.month) === (monthIndex + 1))
  }, [allBooks, monthIndex])

  const handleSave = async (bookName: string) => {
    setIsSaving(bookName)
    try {
      const data = bookEdits[bookName]
      await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_REVIEW", email: userEmail, bookName,
          rating: Number(data.rating), coverUrl: data.cover,
          totalPages: Number(data.pages), review: data.review,
          genre: data.genre, year: Number(year), month: monthIndex + 1
        }),
      })
      await loadData() 
    } catch (err: any) { alert("Erro ao salvar") } finally { setIsSaving(null) }
  }

  const handleDelete = async (bookId: string, bookName: string) => {
    if (!confirm(`Excluir "${bookName}"?`)) return
    setIsDeleting(bookId)
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" })
      if (res.ok) {
        // Remove do estado local para ser instantâneo
        setAllBooks(prev => prev.filter(b => b.id !== bookId))
      }
    } finally { setIsDeleting(null) }
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4">
      
      {/* 1. QUADRO DE FAVORITOS DO ANO */}
      {isDecember && stats.yearlyFavorites.length > 0 && (
        <Card className="p-8 border-none bg-gradient-to-br from-amber-500/10 via-transparent to-primary/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="text-red-500 fill-red-500" size={24} />
            <div className="text-left">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Os Melhores de {year}</h2>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Sua Galeria de Ouro</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {stats.yearlyFavorites.map((fav, i) => (
              <div key={i} className="group relative w-24 sm:w-32 text-center transition-transform hover:scale-105">
                <div className="aspect-[2/3] rounded-lg shadow-xl overflow-hidden border-2 border-amber-400 mb-2 bg-slate-200">
                  <img src={bookEdits[fav.book_name]?.cover || fav.cover_url || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                </div>
                <p className="text-[9px] font-black uppercase leading-tight truncate px-1 text-slate-700">{fav.book_name}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 2. DASHBOARD DE NÚMEROS */}
      <Card className="p-6 bg-white border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <p className="text-[10px] font-black uppercase text-slate-400">Desempenho: {month}</p>
          </div>
          <div className="flex items-center gap-4 text-right">
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total do Ano</p>
                <p className="text-sm font-black text-slate-700">{stats.yearTotal} Livros / {stats.yearPages} Págs</p>
             </div>
             <BarChart3 size={20} className="text-slate-200" />
          </div>
        </div>

        <div className="grid grid-cols-2">
          <div className="text-center border-r border-slate-100">
            <p className="text-6xl font-black text-slate-800 tracking-tighter">{stats.monthTotal}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Livros Lidos no Mês</p>
          </div>
          <div className="text-center">
            <p className="text-6xl font-black text-slate-800 tracking-tighter">{stats.monthPages}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Páginas Lidas no Mês</p>
          </div>
        </div>
      </Card>

      {/* 3. DESTAQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Trophy size={18} className="text-blue-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destaque do Mês</h2>
          </div>
          {stats.biggest ? (
            <Card className="p-6 bg-blue-600 text-white border-none shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[180px]">
              <Trophy className="absolute -right-4 -bottom-4 text-blue-500 opacity-30" size={100} />
              <p className="text-[9px] font-black uppercase text-blue-200 mb-2 tracking-widest relative z-10 text-left">O Mais Longo</p>
              <h3 className="text-lg font-black uppercase leading-tight mb-4 line-clamp-2 pr-4 z-10 text-left">{stats.biggest.book_name}</h3>
              <div className="z-10 text-left">
                <span className="bg-blue-500/50 backdrop-blur-sm border border-blue-400/30 px-3 py-1 rounded-full text-[11px] font-black uppercase">
                  {bookEdits[stats.biggest.book_name]?.pages || stats.biggest.total_pages} Páginas
                </span>
              </div>
            </Card>
          ) : (
            <Card className="h-[180px] bg-slate-50 border-dashed border-2 flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase">Sem registros</Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Crown size={18} className="text-amber-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Favoritos de {month}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.favoritesList.length > 0 ? (
              stats.favoritesList.slice(0, 4).map((fav, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white border border-amber-100/50 rounded-xl shadow-sm text-left">
                  <div className="w-12 h-16 bg-slate-100 rounded shadow-sm overflow-hidden shrink-0">
                    <img src={bookEdits[fav.book_name]?.cover || fav.cover_url || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase text-slate-700 truncate mb-1">{fav.book_name}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} className="fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 h-[180px] flex items-center justify-center border-2 border-dashed rounded-xl text-slate-300 text-[10px] font-bold uppercase">Nenhum favorito no mês</div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 5. LISTA DE EDIÇÃO GERAL */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={18} className="text-slate-400" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gerenciar Livros de {month}</h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {currentMonthBooks.map((book, idx) => {
          const isFav = Number(bookEdits[book.book_name]?.rating || book.rating) === 5;
          return (
            <Card key={idx} className={`flex flex-col sm:flex-row min-h-[220px] overflow-hidden shadow-md transition-all ${isFav ? 'border-amber-200 bg-amber-50/5' : 'border-slate-100'}`}>
              <div className="w-full sm:w-44 bg-slate-100 shrink-0 relative">
                <img src={bookEdits[book.book_name]?.cover || book.cover_url || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="capa" />
                {isFav && <div className="absolute top-3 left-3 bg-amber-500 text-white p-1.5 rounded-sm shadow-lg"><Crown size={14} fill="white" /></div>}
              </div>
              
              <div className="flex-1 p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start text-left">
                  <h4 className="font-black text-sm uppercase text-slate-800 truncate pr-4">{book.book_name}</h4>
                  <div className="flex gap-2">
                    {isSaving === book.book_name && <Loader2 size={16} className="animate-spin text-primary" />}
                    <button onClick={() => handleDelete(book.id, book.book_name)} className="text-slate-300 hover:text-red-500 transition-colors">
                        {isDeleting === book.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Capa URL</p>
                        <Input className="h-9 text-xs bg-slate-50 border-none" value={bookEdits[book.book_name]?.cover || ""} onChange={(e) => setBookEdits(p => ({...p, [book.book_name]: {...p[book.book_name], cover: e.target.value}}))} />
                      </div>
                      <div className="w-24 text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Páginas</p>
                        <Input type="number" className="h-9 text-xs bg-slate-50 border-none font-bold" value={bookEdits[book.book_name]?.pages || ""} onChange={(e) => setBookEdits(p => ({...p, [book.book_name]: {...p[book.book_name], pages: Number(e.target.value)}}))} />
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Gênero</p>
                      <select 
                        className="w-full h-9 text-[11px] font-bold bg-slate-50 border-none rounded-md px-3 appearance-none uppercase text-slate-700"
                        value={bookEdits[book.book_name]?.genre || ""}
                        onChange={(e) => setBookEdits(p => ({...p, [book.book_name]: {...p[book.book_name], genre: e.target.value}}))}
                      >
                        <option value="">Selecionar...</option>
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Quote size={8} /> Notas</p>
                      <Textarea 
                        placeholder="Reflexões..."
                        className="text-xs bg-slate-50 border-none resize-none h-24"
                        value={bookEdits[book.book_name]?.review || ""}
                        onChange={(e) => setBookEdits(p => ({...p, [book.book_name]: {...p[book.book_name], review: e.target.value}}))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-end items-end gap-6">
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={28} className={`cursor-pointer transition-all hover:scale-110 ${s <= (bookEdits[book.book_name]?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-100"}`} onClick={() => setBookEdits(p => ({...p, [book.book_name]: {...p[book.book_name], rating: s}}))} />
                      ))}
                    </div>
                    <Button 
                      className="w-full lg:w-auto px-12 h-12 font-black text-[10px] uppercase tracking-widest shadow-xl" 
                      onClick={() => handleSave(book.book_name)} 
                      disabled={isSaving === book.book_name}
                    >
                      {isSaving === book.book_name ? "Salvando..." : "Salvar"}
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