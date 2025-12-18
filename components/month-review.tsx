"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Star, BookMarked, PlusCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMonthData, saveMonthData, type BookData } from "@/lib/storage"

interface MonthReviewProps {
  month: string
  userEmail: string
  monthIndex: number
}

const emptyBook: BookData = { title: "", cover: "", rating: 0 }

export function MonthReview({ month, userEmail, monthIndex }: MonthReviewProps) {
  const [books, setBooks] = useState<Record<number, BookData>>({})

  useEffect(() => {
    const savedData = getMonthData(userEmail, monthIndex)
    if (savedData.books && Object.keys(savedData.books).length > 0) {
      setBooks(savedData.books)
    } else {
      setBooks({ 0: emptyBook })
    }
  }, [userEmail, monthIndex])

  useEffect(() => {
    const monthData = getMonthData(userEmail, monthIndex)
    saveMonthData(userEmail, monthIndex, monthData.days || {}, books)
  }, [books, userEmail, monthIndex])

  const updateBook = (index: number, field: keyof BookData, value: string | number) => {
    setBooks((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }))
  }

  const setRating = (bookIndex: number, rating: number) => {
    updateBook(bookIndex, "rating", rating)
  }

  const addBook = () => {
    setBooks((prev) => {
      const currentIndices = Object.keys(prev).map(Number)
      const newIndex = currentIndices.length > 0 ? Math.max(...currentIndices) + 1 : 0
      
      return {
        ...prev,
        [newIndex]: emptyBook,
      }
    })
  }
  
  const removeBook = (indexToRemove: number) => {
    setBooks((prev) => {
      const { [indexToRemove]: _, ...rest } = prev
      
      // Garante que haja sempre pelo menos um campo vazio se a lista ficar vazia
      if (Object.keys(rest).length === 0) {
        return { 0: emptyBook }
      }
      
      return rest
    })
  }

  const bookEntries = Object.entries(books).sort(([a], [b]) => Number(a) - Number(b))

  return (
    <Card className="border-accent/20 bg-card p-6 shadow-lg md:p-10">
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Livros Lidos em {month}</h2>
        </div>
        <p className="text-sm text-muted-foreground">Registre suas leituras do mês</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        {bookEntries.map(([index, book], arrayIndex) => (
          <div
            key={index}
            className="group relative rounded-lg border border-border bg-background/50 p-4 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <Button
              onClick={() => removeBook(Number(index))}
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
              title="Remover Livro"
            >
              <XCircle className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-4">
              <div className="h-32 w-24 shrink-0 overflow-hidden rounded-md border-2 border-border bg-background/80 transition-colors group-hover:border-primary/40">
                {book.cover ? (
                  <img
                    src={book.cover || "/placeholder.svg"}
                    alt={book.title || "Capa do livro"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML =
                          '<div class="flex h-full items-center justify-center"><div class="text-center"><svg class="mx-auto mb-1 h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><p class="text-[10px] text-muted-foreground">Sem capa</p></div></div>'
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <BookMarked className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">Sem capa</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Livro #{arrayIndex + 1}</p>
                  <Input
                    placeholder="URL da capa"
                    value={book.cover || ""}
                    onChange={(e) => updateBook(Number(index), "cover", e.target.value)}
                    className="h-8 border-border/50 bg-background text-xs"
                  />
                  <Input
                    placeholder="Nome do livro"
                    value={book.title || ""}
                    onChange={(e) => updateBook(Number(index), "title", e.target.value)}
                    className="h-8 border-border/50 bg-background text-sm"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Avaliação</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(Number(index), star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= (book.rating || 0) ? "fill-primary text-primary" : "text-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="col-span-full mt-4 flex justify-center">
          <Button 
            onClick={addBook} 
            variant="outline" 
            className="flex items-center gap-2 border-dashed border-border/70 text-muted-foreground hover:bg-background/80"
          >
            <PlusCircle className="h-4 w-4" />
            Adicionar Livro
          </Button>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="h-px w-12 bg-border" />
        <span>✦</span>
        <div className="h-px w-12 bg-border" />
      </div>
    </Card>
  )
}