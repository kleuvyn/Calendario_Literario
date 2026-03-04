"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, BookOpen, User, Hash } from "lucide-react"
import { useState } from "react"

interface EditBookDialogProps {
  open: boolean
  onClose: () => void
  bookName: string
  bookData?: {
    author?: string
    pages?: number
    rating?: number
    notes?: string
  }
  onSave: (data: {
    newName: string
    author: string
    pages: number
    rating: number
    notes: string
  }) => void
}

export function EditBookDialog({ open, onClose, bookName, bookData, onSave }: EditBookDialogProps) {
  const [newName, setNewName] = useState(bookName)
  const [author, setAuthor] = useState(bookData?.author || "")
  const [pages, setPages] = useState(bookData?.pages?.toString() || "")
  const [rating, setRating] = useState(bookData?.rating || 0)
  const [notes, setNotes] = useState(bookData?.notes || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      newName,
      author,
      pages: parseInt(pages) || 0,
      rating,
      notes,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="text-primary" />
            Editar Livro
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <BookOpen size={16} />
              Título
            </Label>
            <Input
              id="title"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do livro"
              className="h-11"
              required
            />
          </div>

          {/* Autor */}
          <div className="space-y-2">
            <Label htmlFor="author" className="flex items-center gap-2">
              <User size={16} />
              Autor
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nome do autor"
              className="h-11"
            />
          </div>

          {/* Páginas */}
          <div className="space-y-2">
            <Label htmlFor="pages" className="flex items-center gap-2">
              <Hash size={16} />
              Número de Páginas
            </Label>
            <Input
              id="pages"
              type="number"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="Páginas"
              className="h-11"
              min="0"
            />
          </div>

          {/* Avaliação */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star size={16} />
              Avaliação
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Impressões</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que você achou deste livro?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
