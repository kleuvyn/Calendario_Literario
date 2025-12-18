import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: "-c search_path=public"
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