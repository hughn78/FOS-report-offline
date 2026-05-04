export type TGAMatch = {
  productName: string;
  recallTitle: string;
  recallLink: string;
  pubDate: string;
};

export type TGAResult =
  | { ok: true; recallsFound: boolean; matches: TGAMatch[]; totalRecallsChecked: number; checkedAt: string }
  | { ok: false; error: string; checkedAt: string };

export async function checkTGARecalls(input: { productNames: string[] }): Promise<TGAResult> {
  // Offline stub — no network call
  return {
    ok: true,
    recallsFound: false,
    matches: [],
    totalRecallsChecked: 0,
    checkedAt: new Date().toISOString(),
  };
}
