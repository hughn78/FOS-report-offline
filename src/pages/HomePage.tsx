import { useCallback, useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Upload, Download, BarChart3, RotateCcw, Save } from "lucide-react";
import { processFosFile, downloadWorkbook, HEADERS, type ProcessResult } from "@/lib/fos-processor";
import { analyze, type AnalysisResult } from "@/lib/fos-analyzer";
import { buildAndDownloadAnalysisWorkbook } from "@/lib/fos-excel-export";
import { StockAnalysisReport } from "@/components/StockAnalysisReport";

type Status =
  | { kind: "idle" }
  | { kind: "loading"; filename: string }
  | { kind: "success"; filename: string; result: ProcessResult }
  | { kind: "error"; message: string };

const ANALYSIS_STEPS = [
  "Parsing product data…",
  "Analysing pricing integrity…",
  "Checking stockouts & dead stock…",
  "Scoring products…",
];

export default function HomePage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragActive, setDragActive] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [excelToast, setExcelToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysis && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [analysis]);

  const handleBuffer = useCallback(async (buffer: Uint8Array, filename: string) => {
    if (!filename.toLowerCase().endsWith(".xlsx")) {
      setStatus({ kind: "error", message: "Please upload a .xlsx file." });
      return;
    }
    setStatus({ kind: "loading", filename });
    try {
      // Convert Uint8Array to File-like for the processor
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const file = new File([blob], filename);
      const result = await processFosFile(file);
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error });
        return;
      }
      setStatus({ kind: "success", filename, result });
    } catch (e: any) {
      setStatus({ kind: "error", message: e?.message || "Failed to process file" });
    }
  }, []);

  const openFileDialog = async () => {
    if (!window.electronAPI) {
      // Fallback: use hidden input for browser dev mode
      document.getElementById("file-input")?.click();
      return;
    }
    const result = await window.electronAPI.dialog.openFile({
      filters: [{ name: "Excel files", extensions: ["xlsx"] }],
    });
    if (result.canceled || !result.buffer) return;
    const buffer = new Uint8Array(result.buffer);
    handleBuffer(buffer, result.name || "report.xlsx");
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files?.[0];
      if (f) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            handleBuffer(new Uint8Array(reader.result), f.name);
          }
        };
        reader.readAsArrayBuffer(f);
      }
    },
    [handleBuffer],
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        handleBuffer(new Uint8Array(reader.result), f.name);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const reset = () => {
    setStatus({ kind: "idle" });
    setAnalysis(null);
    setAnalysing(false);
    setAnalysisStep(0);
    setExportingExcel(false);
    setExcelToast(null);
    setSaveToast(null);
  };

  const onDownload = () => {
    if (status.kind !== "success") return;
    downloadWorkbook(status.result.workbook, status.result.filename);
  };

  const onRunAnalysis = async () => {
    if (status.kind !== "success") return;
    setAnalysing(true);
    setAnalysisStep(0);
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(i);
      await new Promise((r) => setTimeout(r, 350));
    }
    const result = analyze(status.result.rows);
    setAnalysis(result);
    setAnalysing(false);
  };

  const onDownloadAnalysisExcel = async () => {
    if (status.kind !== "success") return;
    setExportingExcel(true);
    setExcelToast(null);
    try {
      await new Promise((r) => setTimeout(r, 50));
      const summary = buildAndDownloadAnalysisWorkbook(status.result.rows);
      setExcelToast(`✓ Analysis exported — ${summary.productCount} products, ${summary.flagCount} flags raised`);
      setTimeout(() => setExcelToast(null), 5000);
    } catch (e: any) {
      setExcelToast(`✗ Export failed — ${e?.message || "unknown error"}`);
    } finally {
      setExportingExcel(false);
    }
  };

  const onSaveReport = async () => {
    if (status.kind !== "success") return;
    setSaving(true);
    setSaveToast(null);
    try {
      const json = JSON.stringify({
        filename: status.filename,
        rows: status.result.rows,
        analysis: analysis,
      });
      const id = await window.electronAPI.db.report.create({
        name: status.filename.replace(/\.xlsx$/i, ""),
        product_count: status.result.rowCount,
        flag_count: analysis?.flagged.length ?? 0,
        file_data: null,
        analysis_data: json,
      });
      setSaveToast(`✓ Report saved (#${id})`);
      setTimeout(() => setSaveToast(null), 5000);
    } catch (e: any) {
      setSaveToast(`✗ Save failed — ${e?.message || "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const previewRows = status.kind === "success" ? status.result.rows.slice(0, 5) : [];

  const fmtCell = (v: any) => {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return v.toLocaleDateString("en-AU");
    return String(v);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            FOS Stock Report Cleaner
          </h1>
          <p className="mt-2 text-sm opacity-80 sm:text-base">
            Blackshaws Road Pharmacy — Z Office Export Formatter
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {/* Drop zone + file dialog */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={openFileDialog}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFileDialog(); }}
            className={[
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragActive
                ? "border-primary bg-accent"
                : "border-border bg-muted/40 hover:border-primary hover:bg-accent",
            ].join(" ")}
          >
            <Upload className="mb-4 h-10 w-10 text-primary" />
            <p className="text-base font-medium text-foreground">
              Drop your FOS Stock Report here, or click to browse
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Accepts .xlsx files exported from Z Office
            </p>
            {status.kind !== "idle" && (
              <p className="mt-3 text-sm text-muted-foreground">
                Selected:{" "}
                <span className="font-medium text-foreground">
                  {status.kind === "loading" ? status.filename : status.kind === "success" ? status.filename : ""}
                </span>
              </p>
            )}
          </div>

          <input id="file-input" type="file" accept=".xlsx" className="hidden" onChange={onFileInputChange} />

          {/* Status */}
          <div className="mt-5 min-h-[2rem]">
            {status.kind === "loading" && (
              <div className="flex items-center gap-3 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Processing…
              </div>
            )}
            {status.kind === "success" && (
              <div className="rounded-md bg-success/10 px-4 py-3 text-sm font-medium text-success">
                ✓ {status.result.rowCount} products loaded — ready to analyse
              </div>
            )}
            {status.kind === "error" && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                ✗ {status.message}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={status.kind !== "success"}
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileSpreadsheet size={16} />
              Download Cleaned Report
            </button>
            <button
              disabled={status.kind !== "success" || analysing}
              onClick={onRunAnalysis}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <BarChart3 size={16} />
              Run Stock Analysis
            </button>
            <button
              disabled={status.kind !== "success" || exportingExcel}
              onClick={onDownloadAnalysisExcel}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={16} />
              Download Analysis (.xlsx)
            </button>
            {window.electronAPI && status.kind === "success" && (
              <button
                disabled={saving}
                onClick={onSaveReport}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save to History"}
              </button>
            )}
            {status.kind !== "idle" && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-destructive"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            )}
          </div>

          {/* Toasts */}
          {(exportingExcel || excelToast) && (
            <div className="mt-4">
              {exportingExcel && <div className="flex items-center gap-3 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />Building analysis workbook…</div>}
              {!exportingExcel && excelToast && <div className={`rounded-md px-4 py-3 text-sm font-medium ${excelToast.startsWith("✓") ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{excelToast}</div>}
            </div>
          )}
          {(saving || saveToast) && (
            <div className="mt-4">
              {saving && <div className="flex items-center gap-3 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />Saving to local database…</div>}
              {!saving && saveToast && <div className={`rounded-md px-4 py-3 text-sm font-medium ${saveToast.startsWith("✓") ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{saveToast}</div>}
            </div>
          )}
          {analysing && (
            <div className="mt-4 flex items-center gap-3 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {ANALYSIS_STEPS[analysisStep]}
            </div>
          )}

          {/* Preview */}
          {status.kind === "success" && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Preview — first 5 rows
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full text-xs">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>{HEADERS.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? "bg-card" : "bg-muted/40"}>
                        {HEADERS.map((_, ci) => (
                          <td key={ci} className="whitespace-nowrap px-3 py-2 text-foreground">{fmtCell(row[ci])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          All processing happens on this device — no data leaves your computer.
        </p>

        {analysis && (
          <div ref={reportRef} className="mt-10">
            <StockAnalysisReport result={analysis} onReset={reset} />
          </div>
        )}
      </main>
    </div>
  );
}
