import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Adjust to your environment variable or hardcode your connection string
});

export const query = (text: string, params: (string | number)[]) => pool.query(text, params);

export default pool;