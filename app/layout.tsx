import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import AuthProvider from '@/components/AuthProvider' 
import Script from 'next/script'

export const metadata: Metadata = {
  title: "Calendário Literário 2026 | Diário de Leituras",
  description: "Planejador literário elegante para registrar suas leituras ao longo do ano de 2026",
  manifest: "/manifest.json", 
  themeColor: "#ffffff", 
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-512.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registrado com sucesso: ', registration.scope);
                }, function(err) {
                  console.log('Falha ao registrar o ServiceWorker: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}