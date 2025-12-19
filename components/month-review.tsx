"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// Adicionado Trash2 aqui
import { Star, Loader2, Save, BookOpen, Calendar, TrendingUp, BookMarked, Trash2 } from "lucide-react"
import { getReadingData } from "@/lib/api-client"

export function MonthReview({ month, userEmail, monthIndex, year }: any) {
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookEdits, setBookEdits] = useState<Record<string, { cover: string, rating: number, pages: number }>>({})
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null) // Estado para loading de exclusão

  const loadData = async () => {
    if (!userEmail) return
    try {
      const data = await getReadingData(userEmail, year)
      setAllBooks(data)

      const initialEdits: any = {}
      data.forEach((b: any) => {
        initialEdits[b.book_name] = {
          cover: b.cover_url || "",
          rating: Number(b.rating) || 0,
          pages: Number(b.total_pages) || 0
        }
      })
      setBookEdits(initialEdits)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [userEmail, year, monthIndex])

  const filteredBooks = useMemo(() => {
    const currentM = monthIndex + 1
    return allBooks.filter(b => {
      if (b.status === "finalizado") {
        return Number(b.finish_month) === currentM
      }
      return Number(b.month) === currentM
    })
  }, [allBooks, monthIndex])

  const stats = useMemo(() => {
    const getPages = (book: any) => Number(bookEdits[book.book_name]?.pages) || Number(book.total_pages) || 0
    
    return {
      monthTotal: filteredBooks.length,
      monthPages: filteredBooks.reduce((acc, b) => acc + getPages(b), 0),
      yearTotal: allBooks.filter(b => b.status === "finalizado").length,
      yearPages: allBooks.filter(b => b.status === "finalizado").reduce((acc, b) => acc + getPages(b), 0)
    }
  }, [allBooks, filteredBooks, bookEdits])

  const handleSave = async (bookName: string) => {
    setIsSaving(bookName)
    try {
      const data = bookEdits[bookName]
      await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_REVIEW",
          email: userEmail,
          bookName: bookName,
          rating: Number(data.rating),
          coverUrl: data.cover,
          totalPages: Number(data.pages),
          year: Number(year),
          month: monthIndex + 1
        }),
      })
      await loadData() 
    } catch (err: any) {
      alert("Erro: " + err.message)
    } finally {
      setIsSaving(null)
    }
  }

  // NOVA FUNÇÃO: handleDelete
  const handleDelete = async (bookId: string, bookName: string) => {
    if (!confirm(`Deseja realmente excluir "${bookName}" da sua lista?`)) return
    
    setIsDeleting(bookId)
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        await loadData()
      } else {
        alert("Erro ao excluir o livro.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(null)
    }
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2"><Calendar size={12}/> Resumo {month}</p>
          <div className="flex justify-around mt-2">
            <div className="text-center"><span className="text-2xl font-black">{stats.monthTotal}</span><p className="text-[10px] uppercase text-muted-foreground">Lidos</p></div>
            <div className="text-center"><span className="text-2xl font-black">{stats.monthPages}</span><p className="text-[10px] uppercase text-muted-foreground">Páginas</p></div>
          </div>
        </Card>
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2"><TrendingUp size={12}/> Meta Anual {year}</p>
          <div className="flex justify-around mt-2">
            <div className="text-center"><span className="text-2xl font-black text-green-700">{stats.yearTotal}</span><p className="text-[10px] uppercase text-muted-foreground">Total</p></div>
            <div className="text-center"><span className="text-2xl font-black text-green-700">{stats.yearPages}</span><p className="text-[10px] uppercase text-muted-foreground">Páginas</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBooks.map((book, idx) => {
          const currentCover = bookEdits[book.book_name]?.cover || book.cover_url;
          return (
            <Card key={idx} className="p-4 flex gap-4">
              <div className="w-20 h-28 bg-muted rounded border overflow-hidden shrink-0">
                {currentCover ? <img src={currentCover} className="w-full h-full object-cover" /> : 
                <div className="w-full h-full flex items-center justify-center bg-accent/10"><BookMarked className="opacity-20" size={24} /></div>}
              </div>
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-black text-xs uppercase text-primary truncate">{book.book_name}</h3>
                    {/* BOTÃO EXCLUIR */}
                    <button 
                      onClick={() => handleDelete(book.id, book.book_name)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      disabled={isDeleting === book.id}
                    >
                      {isDeleting === book.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                </div>
                
                <Input 
                  placeholder="Link da Capa" 
                  className="h-7 text-[10px]" 
                  value={bookEdits[book.book_name]?.cover || ""}
                  onChange={(e) => setBookEdits(prev => ({...prev, [book.book_name]: {...prev[book.book_name], cover: e.target.value}}))}
                />
                <div className="flex items-center gap-2">
                  <BookOpen size={12} className="text-primary" />
                  <Input 
                    type="number" 
                    className="h-7 w-20 text-[10px]" 
                    value={bookEdits[book.book_name]?.pages || ""}
                    onChange={(e) => setBookEdits(prev => ({...prev, [book.book_name]: {...prev[book.book_name], pages: Number(e.target.value)}}))}
                  />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Páginas</span>
                </div>
                <div className="mt-auto flex justify-between items-center border-t pt-2">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={`cursor-pointer ${s <= (bookEdits[book.book_name]?.rating || 0) ? "fill-primary text-primary" : "text-border"}`} onClick={() => setBookEdits(prev => ({...prev, [book.book_name]: {...prev[book.book_name], rating: s}}))} />
                    ))}
                  </div>
                  <Button size="sm" className="h-7 w-7 rounded-full" onClick={() => handleSave(book.book_name)} disabled={isSaving === book.book_name}>
                    {isSaving === book.book_name ? <Loader2 className="animate-spin" size={12} /> : <Save size={14} />}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}