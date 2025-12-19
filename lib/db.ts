import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

export async function executeQuery(query: string, params: any[] = []) {
  try {

    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;');
    await pool.query('ALTER TABLE reading_data ADD COLUMN IF NOT EXISTS author TEXT;');
    await pool.query('ALTER TABLE reading_data ADD COLUMN IF NOT EXISTS rating INTEGER;');
    await pool.query('ALTER TABLE reading_data ADD COLUMN IF NOT EXISTS cover_url TEXT;');
    await pool.query('ALTER TABLE reading_data ADD COLUMN IF NOT EXISTS email TEXT;');

    const result = await pool.query(query, params);
    return result.rows; 
  } catch (error) {
    console.error('Erro detalhado no Banco de Dados:', error);
    throw error;
  }
}