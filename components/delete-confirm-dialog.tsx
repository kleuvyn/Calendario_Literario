"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  bookName: string
  isLoading?: boolean
}

export function DeleteConfirmDialog({ 
  open, 
  onClose, 
  onConfirm, 
  bookName,
  isLoading 
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-rose-100">
              <AlertTriangle className="h-6 w-6 text-rose-700" />
            </div>
            <AlertDialogTitle className="text-xl">Excluir Livro</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base leading-relaxed">
            Tem certeza que deseja excluir <strong className="text-foreground">"{bookName}"</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita e todos os dados relacionados a este livro serão removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className="bg-rose-200 text-rose-900 border border-rose-300 hover:bg-rose-300 focus:ring-rose-300"
          >
            {isLoading ? "Excluindo..." : "Sim, excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
