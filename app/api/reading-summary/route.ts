import { NextResponse } from "next/server";
import { getReadingSummary } from "@/lib/reading-summary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const yearParam = searchParams.get('year');

  if (!email || !yearParam) {
    return NextResponse.json(
      { error: 'Missing email or year query parameter' },
      { status: 400 }
    );
  }

  const year = Number(yearParam);
  if (Number.isNaN(year)) {
    return NextResponse.json(
      { error: 'Year must be a number' },
      { status: 400 }
    );
  }

  try {
    const summary = await getReadingSummary(email, year);
    return NextResponse.json(summary, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to load reading summary' },
      { status: 500, headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' } }
    );
  }
}
