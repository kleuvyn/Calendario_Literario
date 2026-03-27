"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" 
import { 
  Star, Loader2, Trash2, Crown, Heart, Zap, Quote, Layers, BarChart3, ChevronDown, Calendar, Edit3, Paperclip, Image as ImageIcon
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    if (!userEmail || !year) return
    try {
      setLoading(true)
      const data: any = await getReadingData(userEmail, year, false, undefined, monthIndex + 1)
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

  useEffect(() => { loadData() }, [loadData])

  function getBookMonth(b: any) {
    if (b.end_date) {
      const endDate = new Date(b.end_date)
      if (!isNaN(endDate.getTime())) return endDate.getMonth() + 1
    }
    if (b.start_date) {
      const startDate = new Date(b.start_date)
      if (!isNaN(startDate.getTime())) return startDate.getMonth() + 1
    }
    return Number(b.month) || 0
  }

  const monthGenres = useMemo(() => {
    const genres = new Set<string>()
    allBooks
      .filter(b => getBookMonth(b) === (monthIndex + 1))
      .forEach(b => {
        const genre = (bookEdits[b.id]?.genre || b.genre || "").toString().trim()
        if (genre) genres.add(genre)
      })
    return Array.from(genres)
  }, [allBooks, monthIndex, bookEdits])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, bookId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Imagem muito grande! Máximo 2MB.")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setBookEdits(prev => ({
          ...prev,
          [bookId]: { ...prev[bookId], cover: reader.result as string }
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (bookId: string, originalName: string) => {
    setIsSaving(bookId)
    try {
      const data = bookEdits[bookId]
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
      setEditingId(null)
      alert("Atualizado com sucesso!")
    } catch (err: any) { alert("Erro ao salvar") } finally { setIsSaving(null) }
  }

  const buscarCapaAutomatica = async (bookId: string, bookName: string) => {
    if (!bookName) return
    setIsSearching(bookId)
    const minhaChave = "AIzaSyB5F5pCIBIgZWCIpKwmBvKhh9RTSTwU9tw"
    const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookName)}&key=${minhaChave}&maxResults=1`
    try {
      const response = await fetch(url)
      const data = await response.json()
      if (data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
        const capaUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace("http://", "https://")
        setBookEdits(prev => ({...prev, [bookId]: { ...prev[bookId], cover: capaUrl }}))
      }
    } catch (e) { console.error(e) } finally { setIsSearching(null) }
  }

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return null
    const s = new Date(start); const e = new Date(end)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
    return Math.max(1, Math.ceil(Math.abs(e.getTime() - s.getTime()) / 86400000) + 1)
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4 font-sans">
      <div className="text-center">
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight">{month} {year}</h2>
        <p className="text-sm text-slate-500">Resumo do mês atual, incluindo lendo e finalizados</p>
      </div>
      {/* CATEGORIAS DO MÊS */}
      {monthGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Categorias do mês:</span>
          {monthGenres.map((g) => (
            <span key={g} className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase">{g}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {allBooks.filter(b => getBookMonth(b) === (monthIndex + 1)).map((book) => {
          const isBeingEdited = editingId === book.id
          const currentCover = bookEdits[book.id]?.cover || book.cover_url || PLACEHOLDER_IMAGE
          const daysRead = calculateDays(book.start_date, book.end_date)

          return (
            <Card key={book.id} className="overflow-hidden border-none shadow-xl rounded-[40px] bg-white">
              
              {!isBeingEdited && (
                <div onClick={() => setEditingId(book.id)} className="group relative cursor-pointer flex items-center p-6 gap-8 hover:bg-slate-50 transition-all">
                  <div className="w-24 h-36 shrink-0 relative">
                    <img src={currentCover} className="w-full h-full object-cover rounded-lg shadow-md border-l-4 border-black/20" alt="capa" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-lg">
                       <Edit3 className="text-white mb-1" size={20} />
                       <span className="text-[8px] text-white font-black uppercase">Editar Registro</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Registro de Leitura</p>
                    <h3 className="text-2xl font-black text-slate-800 italic uppercase leading-tight">{bookEdits[book.id]?.name || book.book_name}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">{bookEdits[book.id]?.genre || "Sem gênero definido"}</p>
                    {daysRead && <p className="text-[10px] text-slate-500 font-black mt-2 uppercase">⏱ {daysRead} dias de imersão</p>}
                  </div>
                  <ChevronDown className="ml-auto text-slate-200 group-hover:text-primary transition-colors" />
                </div>
              )}

              {isBeingEdited && (
                <div className="p-8 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-8">
                     <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="text-[10px] font-black uppercase text-slate-400">← Voltar</Button>
                     <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">Editando Review</p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-10">
                    <div className="shrink-0 space-y-4">
                      <div className="w-52 aspect-[3/4.2] relative rounded-r-2xl overflow-hidden shadow-2xl border-l-[8px] border-black/30">
                        <img src={currentCover} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                      <div className="flex gap-2">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, book.id)} />
                        <Button type="button" variant="outline" className="flex-1 h-10 rounded-xl border-dashed text-[10px] font-black" onClick={() => fileInputRef.current?.click()}><Paperclip size={14} /> UPLOAD</Button>
                        <Button type="button" variant="secondary" className="h-10 px-3 rounded-xl" onClick={() => buscarCapaAutomatica(book.id, bookEdits[book.id]?.name)} disabled={isSearching === book.id}><Zap size={14} className="fill-current" /></Button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Título do Livro</p>
                            <Input className="font-black italic uppercase text-lg bg-slate-50 border-none h-12" value={bookEdits[book.id]?.name || ""} onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], name: e.target.value}}))} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Páginas</p>
                               <Input type="number" className="bg-slate-50 border-none font-black" value={bookEdits[book.id]?.pages || ""} onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], pages: Number(e.target.value)}}))} />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Gênero Literário</p>
                               <select 
                                 className="w-full h-10 bg-slate-50 border-none rounded-xl px-3 text-[10px] font-black uppercase text-slate-600 appearance-none"
                                 value={bookEdits[book.id]?.genre || ""}
                                 onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], genre: e.target.value}}))}
                               >
                                 <option value="">Selecionar...</option>
                                 {Object.entries(GENRE_CATEGORIES).map(([cat, genres]) => (
                                   <optgroup key={cat} label={cat}>
                                     {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                   </optgroup>
                                 ))}
                               </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><Quote size={10}/> Review</p>
                          <Textarea className="bg-slate-50 border-none h-40 text-xs p-4 leading-relaxed rounded-2xl" placeholder="Escreva sua experiência..." value={bookEdits[book.id]?.review || ""} onChange={(e) => setBookEdits(p => ({...p, [book.id]: {...p[book.id], review: e.target.value}}))} />
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100">
                        <div className="flex gap-2 bg-slate-50 p-4 rounded-3xl">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={28} className={`cursor-pointer transition-all ${s <= (bookEdits[book.id]?.rating || 0) ? "fill-amber-400 text-amber-400 scale-110" : "text-slate-200"}`} onClick={() => setBookEdits(p => ({...p, [book.id]: {...p[book.id], rating: s}}))} />
                          ))}
                        </div>
                        <Button className="w-full lg:w-72 h-14 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:bg-primary/90" onClick={() => handleSave(book.id, book.book_name)} disabled={isSaving === book.id}>
                          {isSaving === book.id ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}