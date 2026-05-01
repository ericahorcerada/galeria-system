import mysql from "mysql2/promise";

const requiredEnvVars = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"] as const;

function requireDatabaseEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) throw new Error(`Missing database environment variables: ${missing.join(", ")}`);
}

declare global { var galeriaMysqlPool: mysql.Pool | undefined; }

export function getPool() {
  requireDatabaseEnv();
  if (!global.galeriaMysqlPool) {
    global.galeriaMysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
    });
  }
  return global.galeriaMysqlPool;
}

export async function getConnection() {
  requireDatabaseEnv();
  return mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    decimalNumbers: true,
  });
}
