import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use your environment variable or connection string
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
