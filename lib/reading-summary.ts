import { executeQuery } from "@/lib/db";

const FINISHED_STATUSES = ['lido', 'finished', 'concluido', 'concluído', 'read', 'finalizado'];
const READING_STATUSES = ['lendo', 'reading', 'in progress', 'em andamento', 'andamento'];
const PLANNED_STATUSES = ['planejado', 'planejados', 'planned', 'planning', 'quero-ler', 'quero ler', 'wishlist', 'desejado'];

export interface ReadingSummary {
  userGoal: number;
  totalReadThisYear: number;
  readingNowThisYear: number;
  plannedThisYear: number;
}

export async function getReadingSummary(email: string, year: number): Promise<ReadingSummary> {
  const normalizedEmail = email.toLowerCase();

  const rows = await executeQuery(
    `SELECT status, year, start_date, end_date FROM reading_data WHERE email = $1 AND (year = $2 OR status IN ('lendo', 'reading'))`,
    [normalizedEmail, year]
  );

  const totalReadThisYear = rows.filter((row: any) => {
    const status = (row.status || '').toLowerCase().trim();
    const yearNumber = Number(row.year) || 0;
    const finished = FINISHED_STATUSES.includes(status) || Boolean(row.end_date);
    return finished && yearNumber === year;
  }).length;

  const readingNowThisYear = rows.filter((row: any) => {
    const status = (row.status || '').toLowerCase().trim();
    return READING_STATUSES.includes(status);
  }).length;

  const plannedThisYear = await executeQuery(
    `SELECT COUNT(*) AS count FROM reading_data WHERE email = $1 AND year = $2 AND status IN ('planejado', 'planejados', 'planned', 'planning', 'quero-ler', 'quero ler', 'wishlist', 'desejado')`,
    [normalizedEmail, year]
  );

  const userRow = await executeQuery(`SELECT literary_goal, goals_by_year FROM users WHERE email = $1`, [normalizedEmail]);
  let userGoal = 12;

  if (userRow && userRow.length > 0) {
    const goalsJson = userRow[0].goals_by_year;
    const globalGoal = Number(userRow[0].literary_goal) || 12;
    if (goalsJson) {
      const goals = typeof goalsJson === 'string' ? JSON.parse(goalsJson) : goalsJson;
      userGoal = Number(goals?.[year?.toString()] ?? globalGoal) || globalGoal;
    } else {
      userGoal = globalGoal;
    }
  }

  return {
    userGoal,
    totalReadThisYear,
    readingNowThisYear,
    plannedThisYear: Number(plannedThisYear?.[0]?.count || 0),
  };
}
