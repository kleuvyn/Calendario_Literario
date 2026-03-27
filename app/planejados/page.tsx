"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Loader2, Bookmark, LogOut, Edit3, BarChart3, Sun, Moon, Sparkles, Trash2, Check, Book as BookIcon, Play, Search, X } from "lucide-react"
import { getReadingData, saveReadingDay, planReading, editReading, deleteReading } from "@/lib/api-client"
import { toast } from "sonner"
import Link from "next/link"
import { EditBookDialog } from "@/components/edit-book-dialog"

const THEMES = {
  light: { primary: '#6366f1', bg: '#f8fafc', text: '#1e293b', card: '#ffffff', name: 'Claro', icon: Sun },
  dark: { primary: '#60a5fa', bg: '#0a0f1f', text: '#e2e8f0', card: '#1a1f35', name: 'Escuro', icon: Moon },
  purple: { primary: '#a855f7', bg: '#faf5ff', text: '#581c87', card: '#ffffff', name: 'Roxo', icon: Sparkles }
}

export default function PlanejadosPage() {
  const { data: session, status } = useSession()
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('light')
  const [currentYear] = useState(() => new Date().getFullYear())
  
  // Estados do Formulário
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newCover, setNewCover] = useState('') 
  const [newFormat, setNewFormat] = useState('Físico')
  const [newOwned, setNewOwned] = useState(false)
  const [newPages, setNewPages] = useState<number | ''>('')
  const [isAdding, setIsAdding] = useState(false)

  const [isUpdating, setIsUpdating] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState<any>(null)

  // Estados da Busca Google Books
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const theme = THEMES[activeTheme] || THEMES.light
  const isDark = activeTheme === 'dark'

  // Busca no Google Books conforme digita
  useEffect(() => {
    if (newTitle.length < 3) {
      setSuggestions([])
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(newTitle)}&maxResults=5`)
        const data = await res.json()
        setSuggestions(data.items || [])
        setShowSuggestions(true)
      } catch (err) { console.error("Erro na busca", err) }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [newTitle])

  const selectSuggestion = (book: any) => {
    const info = book.volumeInfo
    setNewTitle(info.title)
    setNewAuthor(info.authors ? info.authors[0] : '')
    setNewCover(info.imageLinks ? info.imageLinks.thumbnail.replace('http:', 'https:') : '')
    setNewPages(info.pageCount || '')
    setShowSuggestions(false)
    toast.success("Dados importados do Google Books")
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as keyof typeof THEMES
    if (savedTheme && THEMES[savedTheme]) setActiveTheme(savedTheme)
    loadData()
  }, [session?.user?.email])

  const loadData = async () => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      const response: any = await getReadingData(session.user.email, currentYear, false)
      setBooks(Array.isArray(response) ? response : response?.data || [])
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const plannedBooks = useMemo(() => {
    return books.filter((book) => (book.status || '').toLowerCase().trim() === 'planejado')
  }, [books])

  const handleDelete = async (bookName: string) => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      await deleteReading(session.user.email, bookName)
      toast.success('Livro removido dos planejados')
      loadData()
    } catch (err) {
      toast.error('Erro ao remover o livro')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartReading = async (book: any) => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      const now = new Date()
      const dateFormatted = now.toISOString()
      const yearValue = now.getUTCFullYear()
      const monthValue = now.getUTCMonth() + 1
      const dayValue = now.getUTCDate()

      await saveReadingDay(
        session.user.email,
        yearValue,
        monthValue,
        dayValue,
        dateFormatted,
        dateFormatted,
        book.book_name,
        'START_READING',
        book.cover_url || book.cover || '',
        book.author_name || book.author || '',
        Number(book.total_pages || book.pages || 0)
      )
      toast.success('Leitura iniciada!')
      loadData()
    } catch (err) {
      toast.error('Erro ao iniciar leitura')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFinishReading = async (book: any) => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      const now = new Date()
      const dateFormatted = now.toISOString()
      await saveReadingDay(
        session.user.email,
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        dateFormatted,
        dateFormatted,
        book.book_name,
        'FINISH_READING'
      )
      toast.success('Livro marcado como concluído!')
      loadData()
    } catch (err) {
      toast.error('Erro ao concluir livro')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditBook = (book: any) => {
    setBookToEdit(book)
    setEditDialogOpen(true)
  }

  const handleUpdateBook = async (data: any) => {
    if (!session?.user?.email || !bookToEdit) return
    setLoading(true)
    try {
      await editReading(session.user.email, bookToEdit.book_name, {
        bookName: data.newName,
        author: data.author || bookToEdit.author_name || bookToEdit.author || '',
        pages: Number(data.pages || bookToEdit.total_pages || bookToEdit.pages || 0),
        coverUrl: data.cover_url || bookToEdit.cover_url || bookToEdit.cover || '',
        format: bookToEdit.format || 'Físico',
        owned: bookToEdit.owned || false,
        status: 'planejado'
      })
      toast.success('Dados do livro atualizados!')
      loadData()
    } catch (err) {
      toast.error('Erro ao salvar edição')
      console.error(err)
    } finally {
      setLoading(false)
      setEditDialogOpen(false)
      setBookToEdit(null)
    }
  }

  const handleAddPlanned = async () => {
    if (!newTitle || !session?.user?.email) return toast.error('Título é obrigatório')
    setIsAdding(true)
    try {
      await planReading(session.user.email, newTitle, newAuthor || undefined, new Date().toISOString(), currentYear, new Date().getMonth() + 1, newCover, Number(newPages) || 0, newFormat, newOwned)
      toast.success('Adicionado aos planejados!')
      setNewTitle(''); setNewAuthor(''); setNewCover(''); setNewPages(''); setNewOwned(false); setNewFormat('Físico')
      loadData()
    } catch (err) { toast.error('Erro ao salvar') } finally { setIsAdding(false) }
  }

  if (status === 'loading') return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen transition-all duration-500 relative" style={{ background: theme.bg, color: theme.text }}>
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: theme.primary }} />
      
      <main className="max-w-7xl mx-auto p-4 md:p-10 relative z-10 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row items-center justify-between backdrop-blur-md p-6 rounded-2xl shadow-lg gap-6 border border-white/40"
             style={{ backgroundColor: isDark ? 'rgba(26, 31, 53, 0.4)' : 'rgba(255, 255, 255, 0.5)' }}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl border-2 border-primary/20 bg-white/50 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? <img src={session.user.image} alt="User" /> : <span className="font-bold">U</span>}
            </div>
            <h1 className="text-xl font-bold">Meus Planejados</h1>
          </div>
          <div className="flex bg-white/30 p-1.5 rounded-xl border border-white/20 gap-1">
            {Object.entries(THEMES).map(([key, val]) => (
              <button key={key} onClick={() => setActiveTheme(key as any)} className={`p-2 rounded-lg ${activeTheme === key ? 'bg-white shadow-sm' : 'opacity-40'}`}>
                <val.icon size={16} style={{ color: val.primary }} />
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => signOut()} className="text-red-500 hover:bg-red-50 gap-2"><LogOut size={18} /> Sair</Button>
        </div>

        {/* NAVEGAÇÃO PRINCIPAL */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/" className="flex-1">
            <Button className="w-full h-14 rounded-2xl text-white font-bold shadow-lg text-lg" style={{ backgroundColor: theme.primary }}>Meus Livros Lidos →</Button>
          </Link>
          <Link href="/retrospectiva" className="flex-1">
            <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-2 text-lg" style={{ borderColor: theme.primary, color: theme.primary, backgroundColor: `${theme.primary}15` }}><BarChart3 size={20} className="mr-2" /> Retrospectiva</Button>
          </Link>
        </div>

        {/* FORMULÁRIO COM BUSCA INTELIGENTE */}
        <Card className="p-6 border border-white/50 shadow-xl backdrop-blur-sm" style={{ backgroundColor: isDark ? 'rgba(26, 31, 53, 0.6)' : 'rgba(255, 255, 255, 0.8)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 relative">
            <div className="relative">
              <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Título (Busca automática)</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 opacity-30" size={16} />
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-white border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:ring-2 ring-primary/30" placeholder="Digite para buscar..." />
              </div>
              
              {/* Sugestões do Google Books */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-50 left-0 right-0 mt-2 bg-white border shadow-2xl rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <div key={i} onClick={() => selectSuggestion(s)} className="p-3 hover:bg-slate-50 cursor-pointer flex gap-3 border-b border-slate-100 last:border-0">
                        <img src={s.volumeInfo.imageLinks?.smallThumbnail} className="h-10 w-8 object-cover rounded shadow-sm" alt="" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-slate-800">{s.volumeInfo.title}</p>
                          <p className="text-xs text-slate-500">{s.volumeInfo.authors?.[0]}</p>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setShowSuggestions(false)} className="w-full p-2 text-[10px] uppercase font-bold text-center bg-slate-100 text-slate-400">Fechar Sugestões</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Autor</label>
              <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none" placeholder="Manual ou Automático" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Link da Capa</label>
              <input value={newCover} onChange={e => setNewCover(e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none" placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <select value={newFormat} onChange={e => setNewFormat(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl outline-none">
              <option>Físico</option><option>E-book</option><option>Audiobook</option>
            </select>
            <input type="number" value={newPages} onChange={e => setNewPages(e.target.value ? Number(e.target.value) : '')} className="bg-white border border-slate-200 p-3 rounded-xl outline-none" placeholder="Páginas" />
            <Button variant="outline" onClick={() => setNewOwned(!newOwned)} className={`rounded-xl border-2 transition-all ${newOwned ? 'border-green-500 text-green-600 bg-green-50 shadow-sm' : 'border-slate-200 opacity-60'}`}>
              {newOwned ? <Check size={16} className="mr-2" /> : <BookIcon size={16} className="mr-2" />} {newOwned ? 'Já possuo' : 'Não tenho'}
            </Button>
            <Button onClick={handleAddPlanned} disabled={isAdding} className="rounded-xl font-bold text-white shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: theme.primary }}>
              {isAdding ? <Loader2 className="animate-spin" /> : 'Salvar no Planejamento'}
            </Button>
          </div>
        </Card>

        {/* LISTAGEM DE PLANEJADOS */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {plannedBooks.map((book) => (
              <motion.div key={book.id || book.book_name} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="p-4 border-none shadow-md group hover:shadow-xl transition-shadow" style={{ backgroundColor: isDark ? theme.card : '#fff' }}>
                  <div className="flex gap-4">
                    <img src={book.cover_url || book.cover || 'https://via.placeholder.com/150'} className="h-40 w-28 rounded-lg object-cover shadow-sm" alt="" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black leading-tight line-clamp-2 text-slate-800 dark:text-slate-100">{book.book_name}</h3>
                        <p className="text-xs opacity-60 mb-2 italic">{book.author_name || 'Autor Desconhecido'}</p>
                        <div className="flex gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-tighter">{book.format || 'Físico'}</span>
                          {book.owned && <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-600 font-bold uppercase tracking-tighter">POSSUO</span>}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button size="sm" className="text-white font-bold h-8" style={{ backgroundColor: theme.primary }} onClick={() => handleStartReading(book)}><Play size={14} className="mr-1" />Iniciar</Button>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => handleFinishReading(book)}><Check size={14} className="mr-1" />Concluir</Button>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => handleEditBook(book)}><Edit3 size={14} className="mr-1" />Editar</Button>
                        <Button size="sm" variant="destructive" className="h-8" onClick={() => handleDelete(book.book_name)}><Trash2 size={14} /></Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <EditBookDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          bookName={bookToEdit?.book_name || ''}
          bookData={{
            author: bookToEdit?.author_name || bookToEdit?.author || '',
            pages: bookToEdit?.total_pages || bookToEdit?.pages || 0,
            rating: bookToEdit?.rating || 0,
            notes: bookToEdit?.notes || '',
            cover_url: bookToEdit?.cover_url || bookToEdit?.cover || ''
          }}
          onSave={handleUpdateBook}
        />
      </main>
    </div>
  )
}