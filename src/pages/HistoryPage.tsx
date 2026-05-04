import { useEffect, useState } from "react";
import { Clock, Trash2, FileSpreadsheet, AlertCircle } from "lucide-react";

interface SavedReport {
  id: number;
  name: string;
  created_at: string;
  product_count: number;
  flag_count: number;
}

export default function HistoryPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const list = await window.electronAPI.db.report.list();
      setReports(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    try {
      await window.electronAPI.db.report.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert("Failed to delete: " + (e?.message || "unknown error"));
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Report History</h1>
          <p className="mt-2 text-muted-foreground">Previously saved FOS reports stored locally on this device.</p>
        </header>

        {loading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading saved reports…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">No saved reports yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Process a report on the New Report page and click "Save to History" to store it here.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{report.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(report.created_at)} · {report.product_count} products · {report.flag_count} flags
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteReport(report.id)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
