"use client"

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface BookFiltersProps {
  onFilterChangeAction: (filters: FilterState) => void
  availableGenres: string[]
}

export interface FilterState {
  search: string
  genres: string[]
  ratingMin: number | null
  sortBy: 'date' | 'rating' | 'pages' | 'title'
}

export function BookFilters({ onFilterChangeAction, availableGenres }: BookFiltersProps) {
  const [search, setSearch] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [ratingMin, setRatingMin] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<FilterState['sortBy']>('date')
  const [isOpen, setIsOpen] = useState(false)

  const applyFilters = () => {
    onFilterChangeAction({
      search: search.trim(),
      genres: selectedGenres,
      ratingMin,
      sortBy
    })
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedGenres([])
    setRatingMin(null)
    setSortBy('date')
    onFilterChangeAction({
      search: "",
      genres: [],
      ratingMin: null,
      sortBy: 'date'
    })
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const hasActiveFilters = search || selectedGenres.length > 0 || ratingMin !== null || sortBy !== 'date'

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar por título ou autor..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            onFilterChangeAction({
              search: e.target.value.trim(),
              genres: selectedGenres,
              ratingMin,
              sortBy
            })
          }}
          className="pl-10 pr-4 h-10"
        />
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 relative">
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-pink-500 text-white text-[10px]">
                {(selectedGenres.length > 0 ? 1 : 0) + (ratingMin !== null ? 1 : 0) + (sortBy !== 'date' ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-white border border-slate-200 shadow-xl" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filtros Avançados</h4>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Ordenar por
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('date')
                    onFilterChangeAction({ search, genres: selectedGenres, ratingMin, sortBy: 'date' })
                  }}
                  className="text-xs"
                >
                  Data
                </Button>
                <Button
                  variant={sortBy === 'rating' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('rating')
                    onFilterChangeAction({ search, genres: selectedGenres, ratingMin, sortBy: 'rating' })
                  }}
                  className="text-xs"
                >
                  Avaliação
                </Button>
                <Button
                  variant={sortBy === 'pages' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('pages')
                    onFilterChangeAction({ search, genres: selectedGenres, ratingMin, sortBy: 'pages' })
                  }}
                  className="text-xs"
                >
                  Páginas
                </Button>
                <Button
                  variant={sortBy === 'title' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('title')
                    onFilterChangeAction({ search, genres: selectedGenres, ratingMin, sortBy: 'title' })
                  }}
                  className="text-xs"
                >
                  Título
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Avaliação mínima
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <Button
                    key={rating}
                    variant={ratingMin === rating ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newRating = ratingMin === rating ? null : rating
                      setRatingMin(newRating)
                      onFilterChangeAction({ search, genres: selectedGenres, ratingMin: newRating, sortBy })
                    }}
                    className="h-8 w-8 p-0"
                  >
                    {rating}⭐
                  </Button>
                ))}
              </div>
            </div>

            {availableGenres.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  Gêneros
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableGenres.map(genre => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => {
                        toggleGenre(genre)
                        const newGenres = selectedGenres.includes(genre)
                          ? selectedGenres.filter(g => g !== genre)
                          : [...selectedGenres, genre]
                        onFilterChangeAction({ search, genres: newGenres, ratingMin, sortBy })
                      }}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setIsOpen(false)} className="w-full" size="sm">
              Aplicar Filtros
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
