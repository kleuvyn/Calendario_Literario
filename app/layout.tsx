import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "@/styles/calendar.css"
import AuthProvider from '@/components/AuthProvider' 
import { Toaster } from "@/components/ui/sonner"
import Script from 'next/script'
import { ErrorBoundary } from '@/components/error-boundary'

export const metadata: Metadata = {
  title: "Diário de Leituras",
  description: "Planejador literário elegante para registrar suas leituras ao longo do ano",
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Calendário Literário",
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-512.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-background text-foreground">
        <ErrorBoundary>
          <AuthProvider>
            <main className="min-h-screen">
              {children}
            </main>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
            },
            className: 'shadow-xl',
          }}
          richColors
        />
        <Analytics />

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(err) {
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}