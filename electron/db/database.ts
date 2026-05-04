import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (!db) {
    const userData = app.getPath("userData");
    const dbDir = path.join(userData, "database");
    fs.mkdirSync(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, "fos-reports.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
    console.log("[DB] Connected:", dbPath);
  }
  return db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      product_count INTEGER DEFAULT 0,
      flag_count INTEGER DEFAULT 0,
      file_data BLOB,
      analysis_data TEXT
    );

    CREATE TABLE IF NOT EXISTS report_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      sku TEXT,
      name TEXT NOT NULL,
      department TEXT,
      soh INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      sell REAL DEFAULT 0,
      ws1_cost REAL DEFAULT 0,
      last_sold TEXT,
      min_stock REAL DEFAULT 0,
      order_qty REAL DEFAULT 0,
      flag TEXT,
      score INTEGER,
      score_band TEXT,
      action TEXT,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_report ON report_products(report_id);
    CREATE INDEX IF NOT EXISTS idx_products_flag ON report_products(flag);
  `);
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
