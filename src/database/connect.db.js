import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: "localhost",
  user: process.env.DB_USER_NAME,
  port: 5432,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function connection() {
  try {
    await pool.connect();
    console.log("Database Successfully Connected");
  } catch (error) {
    console.log("Database not connected");
    console.log(error);
  }
}

export default connection;
export { pool };
