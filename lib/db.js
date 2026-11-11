import mysql from "mysql2/promise";

const globalForDb = globalThis;

export const pool =
  globalForDb.__pawmatchPool ||
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pawmatchPool = pool;
}
