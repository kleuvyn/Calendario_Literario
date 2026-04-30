import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getReadingSummary } from "@/lib/reading-summary";
import { HomeClient } from "@/components/home-client";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const currentYear = new Date().getFullYear();
  let summary: any = undefined;

  if (session?.user?.email) {
    try {
      summary = await getReadingSummary(session.user.email, currentYear);
    } catch (error) {
      console.error('Falha ao carregar resumo no servidor:', error);
    }
  }

  return <HomeClient initialSession={session} initialSummary={summary} currentYear={currentYear} />;
}
