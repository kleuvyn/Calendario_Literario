import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { Heart } from "lucide-react"
import "./globals.css"
import "@/styles/calendar.css"
import AuthProvider from '@/components/AuthProvider' 
import { Toaster } from "@/components/ui/sonner"
import Script from 'next/script'
import { ErrorBoundary } from '@/components/error-boundary'
import { LGPDConsentBanner } from '@/components/lgpd-consent-banner'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://calendario-literario.kleuvyn.tec.br"
const SITE_NAME = "Calendário Literário"
const SITE_DESCRIPTION = "Planejador literário elegante para registrar leituras, metas e resenhas num calendário interativo para leitores brasileiros."

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  keywords: [
    "diário de leitura",
    "calendário literário",
    "metas de leitura",
    "planner de livros",
    "registro de leituras",
    "resenhas de livros",
    "planejador literário",
    "agenda de leitura",
  ],
  authors: [
    { name: SITE_NAME, url: SITE_URL }
  ],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
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
    title: SITE_NAME,
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-512.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#8C7B6E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": SITE_URL,
  "name": SITE_NAME,
  "description": SITE_DESCRIPTION,
  "publisher": {
    "@type": "Organization",
    "name": SITE_NAME,
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}/icon-512.png`
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-background text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <ErrorBoundary>
          <AuthProvider>
            <main className="min-h-screen">
              {children}
            </main>
          </AuthProvider>
        </ErrorBoundary>
        <footer className="p-4 sm:p-6 text-center opacity-20 italic text-[10px] font-bold flex flex-col items-center gap-2">
          <Heart size={14} /> Meu calendário literário • Kleuvyn
          <Link href="/privacidade" className="underline underline-offset-2 hover:text-slate-900">Política de Privacidade</Link>
          <span>•Dados usados apenas para melhorar sua leitura.</span>
        </footer>
        <LGPDConsentBanner />
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