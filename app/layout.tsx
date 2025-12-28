import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import AuthProvider from '@/components/AuthProvider' 
import Script from 'next/script'

export const metadata: Metadata = {
  title: "Diário de Leituras",
  description: "Planejador literário elegante para registrar suas leituras ao longo do ano",
  manifest: "/manifest.json", 
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-512.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-background text-foreground">
        <AuthProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
        <Analytics />

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('SW ok: ', registration.scope);
                }, function(err) {
                  console.log('SW erro: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}