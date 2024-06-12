import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const pool = new Pool({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT!),
  host: process.env.DATABASE_HOST,
  ssl: true,
  idleTimeoutMillis: 1
});

// Function to handle queries
export const query = async (text: string, params: (string | number)[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    throw error; // Re-throw the error for handling
  }
};

export default pool;
