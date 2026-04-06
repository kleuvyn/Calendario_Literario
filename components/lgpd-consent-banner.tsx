"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import Link from "next/link"

const CONSENT_KEY = "lgpd_consent"

type ConsentState = "accepted" | "declined" | "unknown"

export function LGPDConsentBanner() {
  const [consent, setConsent] = useState<ConsentState>("unknown")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY) as ConsentState | null
    if (stored === "accepted" || stored === "declined") {
      setConsent(stored)
    } else {
      setConsent("unknown")
    }
    setMounted(true)
  }, [])

  const accept = () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted")
    setConsent("accepted")
  }

  const decline = () => {
    window.localStorage.setItem(CONSENT_KEY, "declined")
    setConsent("declined")
  }

  if (!mounted) return null

  return (
    <>
      {consent === "accepted" && <Analytics />}
      {consent === "unknown" && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl p-4 sm:p-5 text-sm text-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Privacidade e consentimento (LGPD)</p>
              <p className="mt-1 text-xs text-slate-500">
                Este site usa apenas dados necessários para salvar suas leituras e preferências. Aceite o uso de análise anônima para melhorar a experiência.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Link href="/privacidade" className="text-[11px] uppercase tracking-[0.25em] font-bold text-slate-600 hover:text-slate-900">
                Política de Privacidade
              </Link>
              <button
                onClick={decline}
                className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                Recusar
              </button>
              <button
                onClick={accept}
                className="rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
