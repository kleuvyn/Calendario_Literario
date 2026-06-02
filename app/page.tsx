import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getReadingSummary } from "@/lib/reading-summary";
import { executeQuery } from "@/lib/db";
import { HomeClient } from "@/components/home-client";

export default async function HomePage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Falha ao validar sessão NextAuth:", error);
    session = null;
  }

  const currentYear = new Date().getFullYear();
  let summary: any = undefined;
  let initialReadings: any[] = [];

  if (session?.user?.email) {
    try {
      summary = await getReadingSummary(session.user.email, currentYear);
    } catch (error) {
      console.error('Falha ao carregar resumo no servidor:', error);
    }

    try {
      const startOfYear = `${currentYear}-01-01`;
      const rows = await executeQuery(
        `SELECT *
         FROM public.reading_data
         WHERE LOWER(email) = LOWER($1)
           AND (
             year = $2
             OR (
               start_date IS NOT NULL
               AND start_date < $3
               AND (end_date IS NULL OR end_date >= $3)
               AND LOWER(COALESCE(status, '')) NOT IN ('planejado', 'planejados', 'planned', 'planning', 'quero-ler', 'quero ler', 'wishlist', 'desejado')
             )
           )
         ORDER BY year, month, start_date`,
        [session.user.email, currentYear, startOfYear]
      );
      initialReadings = JSON.parse(JSON.stringify(rows));
    } catch (error) {
      console.error('Falha ao pré-carregar dados do calendário:', error);
      initialReadings = [];
    }
  }

  return <HomeClient initialSession={session} initialSummary={summary} currentYear={currentYear} initialReadings={initialReadings} />;
}
