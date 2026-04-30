import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não definida.");
}

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const BOOTSTRAP_VERSION = "bootstrap_v1";

const bootstrapStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT NOT NULL,
    password TEXT,
    image TEXT,
    literary_goal INTEGER DEFAULT 12,
    goals_by_year TEXT DEFAULT '{}',
    theme TEXT DEFAULT 'rose', 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)",
  `CREATE TABLE IF NOT EXISTS reading_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email TEXT,
    book_name TEXT NOT NULL,
    author TEXT,
    author_name TEXT,
    rating INTEGER,
    cover_url TEXT,
    genre TEXT,
    format TEXT,
    owned INTEGER DEFAULT 0,
    review TEXT,
    notes TEXT,
    total_pages INTEGER DEFAULT 0,
    status TEXT,
    start_date TEXT,
    end_date TEXT,
    finish_month INTEGER,
    year INTEGER,
    month INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE INDEX IF NOT EXISTS reading_data_email_idx ON reading_data (email)",
  "CREATE INDEX IF NOT EXISTS reading_data_user_id_idx ON reading_data (user_id)",
  "CREATE INDEX IF NOT EXISTS reading_data_email_year_idx ON reading_data (email, year)",
  "CREATE INDEX IF NOT EXISTS reading_data_email_month_idx ON reading_data (email, month)",
  "CREATE INDEX IF NOT EXISTS reading_data_email_year_month_idx ON reading_data (email, year, month)",
  `CREATE TABLE IF NOT EXISTS book_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    rating INTEGER DEFAULT 0,
    cover_url TEXT,
    total_pages INTEGER DEFAULT 0,
    genre TEXT,
    review TEXT,
    year INTEGER,
    month INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS book_reviews_user_id_title_unique ON book_reviews (user_id, title)",
  `CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email TEXT,
    user_email TEXT,
    title TEXT,
    cover_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE INDEX IF NOT EXISTS books_email_idx ON books (email)",
  "CREATE INDEX IF NOT EXISTS books_user_email_idx ON books (user_email)",
  "CREATE INDEX IF NOT EXISTS books_user_id_title_idx ON books (user_id, title)",
  "CREATE INDEX IF NOT EXISTS books_title_idx ON books (title)",
  "ALTER TABLE users ADD COLUMN password TEXT",
  "ALTER TABLE users ADD COLUMN image TEXT",
  "ALTER TABLE reading_data ADD COLUMN author TEXT",
  "ALTER TABLE reading_data ADD COLUMN author_name TEXT",
  "ALTER TABLE reading_data ADD COLUMN rating INTEGER",
  "ALTER TABLE reading_data ADD COLUMN cover_url TEXT",
  "ALTER TABLE reading_data ADD COLUMN genre TEXT",
  "ALTER TABLE reading_data ADD COLUMN format TEXT",
  "ALTER TABLE reading_data ADD COLUMN owned BOOLEAN",
  "ALTER TABLE reading_data ADD COLUMN review TEXT",
  "ALTER TABLE reading_data ADD COLUMN email TEXT",
];

let bootstrapPromise: Promise<void> | null = null;

function normalizeSql(sql: string) {
  return sql
    .replace(/\bpublic\./gi, "")
    .replace(/JSONB/gi, "TEXT")
    .replace(/::jsonb/gi, "")
    .replace(/NOW\(\)/gi, "CURRENT_TIMESTAMP");
}

function convertPgParams(sql: string, params: any[]) {
  const indexes: number[] = [];
  const convertedSql = sql.replace(/\$(\d+)/g, (_match, num) => {
    indexes.push(Number(num) - 1);
    return "?";
  });

  if (indexes.length === 0) {
    return { sql: convertedSql, args: params ?? [] };
  }

  const args = indexes.map((index) => params[index]);
  return { sql: convertedSql, args };
}

function isIgnorableSchemaError(error: unknown) {
  const message = String((error as any)?.message || "").toLowerCase();
  return (
    message.includes("duplicate column name") ||
    message.includes("already exists") ||
    message.includes("no such table")
  );
}

async function hasColumn(tableName: string, columnName: string) {
  const normalizedTable = tableName.replace(/\bpublic\./gi, "");
  const result = await client.execute({ sql: `PRAGMA table_info("${normalizedTable}")` });
  const rows = result.rows ?? [];
  return rows.some((row: any) => String(row.name).toLowerCase() === columnName.toLowerCase());
}

async function executeAlterTableAddColumnIfNotExists(sql: string) {
  const match = /^\s*ALTER\s+TABLE\s+(["'\w\.]+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+(.+)$/i.exec(sql);
  if (!match) {
    return null;
  }

  const tableName = match[1].replace(/^"|"$/g, "");
  const columnDefinition = match[2].trim();
  const columnNameMatch = /^(["']?)([^"'\s]+)\1/.exec(columnDefinition);
  if (!columnNameMatch) {
    return null;
  }

  const columnName = columnNameMatch[2];
  if (await hasColumn(tableName, columnName)) {
    return { sql: "", args: [] };
  }

  return { sql: `ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`, args: [] };
}

async function ensureBootstrapSchema() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await client.execute(
        `CREATE TABLE IF NOT EXISTS __schema_bootstrap (
          version TEXT PRIMARY KEY,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      );

      const bootstrapState = await client.execute({
        sql: "SELECT version FROM __schema_bootstrap WHERE version = ? LIMIT 1",
        args: [BOOTSTRAP_VERSION],
      });

      if ((bootstrapState.rows ?? []).length > 0) {
        return;
      }

      for (const statement of bootstrapStatements) {
        try {
          await client.execute(statement);
        } catch (error) {
          if (!isIgnorableSchemaError(error)) {
            throw error;
          }
        }
      }

      await client.execute({
        sql: "INSERT OR IGNORE INTO __schema_bootstrap (version) VALUES (?)",
        args: [BOOTSTRAP_VERSION],
      });
    })();
  }

  await bootstrapPromise;
}

export async function executeQuery(query: string, params: any[] = []) {
  try {
    await ensureBootstrapSchema();

    const normalizedQuery = normalizeSql(query);
    const alterResponse = await executeAlterTableAddColumnIfNotExists(normalizedQuery);

    if (alterResponse) {
      if (!alterResponse.sql) {
        return [];
      }
      const { sql, args } = convertPgParams(alterResponse.sql, params);
      const result = await client.execute({ sql, args });
      return result.rows ?? [];
    }

    const { sql, args } = convertPgParams(normalizedQuery, params);
    const result = await client.execute({ sql, args });
    return result.rows ?? [];
  } catch (error) {
    console.error("Erro detalhado no Banco de Dados:", error);
    throw error;
  }
}