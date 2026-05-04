import { getDatabase } from "./database";

export interface SavedReport {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  product_count: number;
  flag_count: number;
}

export interface ReportDetail extends SavedReport {
  file_data?: Buffer;
  analysis_data?: string;
}

export const reportQueries = {
  list(): SavedReport[] {
    const db = getDatabase();
    return db
      .prepare("SELECT id, name, created_at, updated_at, product_count, flag_count FROM reports ORDER BY created_at DESC")
      .all() as SavedReport[];
  },

  get(id: number): ReportDetail | null {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(id) as ReportDetail | undefined;
    return row ?? null;
  },

  create(report: Omit<ReportDetail, "id">): number {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO reports (name, product_count, flag_count, file_data, analysis_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      report.name,
      report.product_count,
      report.flag_count,
      report.file_data ?? null,
      report.analysis_data ?? null
    );
    return Number(result.lastInsertRowid);
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare("DELETE FROM reports WHERE id = ?").run(id);
    return result.changes > 0;
  },
};
