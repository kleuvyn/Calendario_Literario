"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, BookOpen, User, FileText } from "lucide-react"
import { searchBooks, type BookSearchResult } from "@/lib/google-books"

interface BookSearchDialogProps {
  open: boolean
  onClose: () => void
  onSelectBook: (book: BookSearchResult) => void
}

export function BookSearchDialog({ open, onClose, onSelectBook }: BookSearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [manualMode, setManualMode] = useState(false)

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      const books = await searchBooks(query)
      setResults(books)
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (book: BookSearchResult) => {
    onSelectBook(book)
    onClose()
    setQuery("")
    setResults([])
  }

  const handleManualEntry = () => {
    onSelectBook({
      title: query,
      authors: "",
      cover: "",
      pages: 0,
      isbn: "",
      description: "",
      categories: [],
    })
    onClose()
    setQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="text-primary" />
            Buscar Livro
          </DialogTitle>
          <DialogDescription>
            Pesquise por título, autor ou ISBN. Os dados são do Google Books.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Digite o nome do livro, autor ou ISBN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-primary" />
            )}
          </div>

          {/* Resultados */}
          <ScrollArea className="h-100 pr-4">
            {results.length === 0 && query.length >= 3 && !isLoading && (
              <div className="text-center py-12 space-y-4">
                <p className="text-muted-foreground">Nenhum livro encontrado</p>
                <Button
                  variant="outline"
                  onClick={handleManualEntry}
                  className="gap-2"
                >
                  <FileText size={16} />
                  Adicionar "{query}" manualmente
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {results.map((book, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(book)}
                  className="flex gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                >
                  {/* Capa */}
                  <div className="w-16 h-24 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-md">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="text-slate-400" size={24} />
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <User size={14} />
                      <span className="line-clamp-1">{book.authors}</span>
                    </div>
                    {book.pages > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {book.pages} páginas
                      </p>
                    )}
                    {book.categories.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {book.categories.slice(0, 2).map((cat, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Botão adicionar manualmente */}
          {query && results.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleManualEntry}
              className="w-full gap-2"
            >
              <FileText size={16} />
              Não encontrou? Adicionar "{query}" manualmente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
