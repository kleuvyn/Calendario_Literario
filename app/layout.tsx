import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "@/styles/calendar.css"
import AuthProvider from '@/components/AuthProvider' 
import { Toaster } from "@/components/ui/sonner"
import Script from 'next/script'
import { ErrorBoundary } from '@/components/error-boundary'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://calendario-literario.kleuvyn.tec.br"

export const metadata: Metadata = {
  title: "Diário de Leituras",
  description: "Planejador literário elegante para registrar suas leituras ao longo do ano",
  applicationName: "Calendário Literário",
  metadataBase: new URL(SITE_URL),
  keywords: [
    "diário de leitura",
    "calendário literário",
    "metas de leitura",
    "planner de livros",
    "registro de leituras",
    "resenhas de livros",
    "capa de livro",
  ],
  authors: [
    { name: "Calendário Literário", url: "https://seudominio.com" }
  ],
  creator: "Calendário Literário",
  publisher: "Calendário Literário",
  openGraph: {
    title: `Retrospectiva de ${new Date().getFullYear()} - Calendário Literário`,
    description: "Acompanhe seus livros lidos, dias de leitura e metas literárias em um calendário interativo.",
    url: SITE_URL,
    siteName: "Calendário Literário",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Calendário Literário - Diário de Leituras"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Diário de Leituras",
    description: "Planejador literário elegante para registrar suas leituras ao longo do ano",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@seuusuario",
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "pt-BR": SITE_URL,
      "en-US": `${SITE_URL}/en`
    }
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
  userScalable: true,
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