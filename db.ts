import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

// Check if all required environment variables are present
// const requiredEnvVariables = [
//   "DATABASE_USER",
//   "DATABASE_PASSWORD",
//   "DATABASE_NAME",
//   "DATABASE_PORT",
//   "DATABASE_HOST"
// ];

// for (const envVar of requiredEnvVariables) {
//   if (!process.env[envVar]) {
//     throw new Error(`Environment variable ${envVar} is not defined.`);
//   }
// }

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // user: process.env.DATABASE_USER,
  // password: process.env.DATABASE_PASSWORD,
  // database: process.env.DATABASE_NAME,
  // port: parseInt(process.env.DATABASE_PORT!),
  // host: process.env.DATABASE_HOST,
  // ssl: true,
  // idleTimeoutMillis: 1000 // Adjust the timeout as needed
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
