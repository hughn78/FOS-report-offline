export type AnalystState = "idle" | "loading" | "success" | "error";

export interface AnalystResult {
  summary: string;
  recommendations: string[];
  warnings: string[];
}

export function useStrategicAnalyst() {
  return {
    state: "idle" as AnalystState,
    result: null as AnalystResult | null,
    error: null as string | null,
    runAnalysis: async () => {
      // Offline — no AI calls. Returns a static prompt for the user.
      console.log("[Offline] Strategic analyst disabled — no network connection.");
    },
  };
}
