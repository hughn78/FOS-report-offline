export type TGAStatus = "idle" | "loading" | "success" | "error";

export interface TGAResult {
  ok: boolean;
  recallsFound: boolean;
  matches: any[];
  error?: string;
}

export function useTGARecallCheck() {
  return {
    status: "idle" as TGAStatus,
    result: null as TGAResult | null,
    error: null as string | null,
    check: async () => {
      console.log("[Offline] TGA recall check disabled — no network connection.");
      return { ok: true, recallsFound: false, matches: [] };
    },
  };
}
