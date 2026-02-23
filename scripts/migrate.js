const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbConfig");

const migrationsDir = path.join(__dirname, "..", "migrations");
const mode = process.argv[2] === "--status" ? "status" : "up";

async function ensureDatabase() {
  const serverConnection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password
  });

  await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await serverConnection.end();
}

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getMigrationFiles() {
  const files = await fs.promises.readdir(migrationsDir);
  return files.filter((file) => file.endsWith(".sql")).sort();
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query(
    "SELECT filename FROM schema_migrations ORDER BY filename ASC"
  );
  return new Set(rows.map((row) => row.filename));
}

async function runStatus(connection) {
  const files = await getMigrationFiles();
  const applied = await getAppliedMigrations(connection);

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  files.forEach((file) => {
    const status = applied.has(file) ? "APPLIED" : "PENDING";
    console.log(`${status}  ${file}`);
  });
}

async function runMigrations(connection) {
  const files = await getMigrationFiles();
  const applied = await getAppliedMigrations(connection);
  const pending = files.filter((file) => !applied.has(file));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const filename of pending) {
    const fullPath = path.join(migrationsDir, filename);
    const sql = await fs.promises.readFile(fullPath, "utf8");

    console.log(`Running ${filename}...`);
    await connection.query(sql);
    await connection.query(
      "INSERT INTO schema_migrations (filename) VALUES (?)",
      [filename]
    );
    console.log(`Completed ${filename}`);
  }

  console.log(`Applied ${pending.length} migration(s).`);
}

async function main() {
  await ensureDatabase();

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    multipleStatements: true
  });

  try {
    await ensureMigrationsTable(connection);

    if (mode === "status") {
      await runStatus(connection);
    } else {
      await runMigrations(connection);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
