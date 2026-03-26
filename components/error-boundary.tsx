"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    let normalizedError: Error

    if (error instanceof Error) {
      normalizedError = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      normalizedError = new Error((error as any).message || String(error))
    } else {
      normalizedError = new Error(String(error))
    }

    console.error('ErrorBoundary captured non-Error:', error)
    return { hasError: true, error: normalizedError }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Algo deu errado
            </h2>
            
            <p className="text-slate-600 mb-6">
              Desculpe, ocorreu um erro inesperado. Tente recarregar a página ou voltar para o início.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-slate-100 rounded text-left">
                <p className="text-xs font-mono text-slate-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar Página
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Ir para Início
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
