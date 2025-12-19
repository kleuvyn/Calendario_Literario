import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

export async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows; 
  } catch (error) {
    console.error('Erro detalhado no Banco de Dados:', error);
    throw error;
  }
}