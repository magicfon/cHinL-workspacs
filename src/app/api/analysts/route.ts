import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CACHE_SECONDS = 24 * 60 * 60; // FMP 免費額度每天 250 次：機構評等一天抓一次

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

async function fmp(path: string, symbol: string): Promise<Record<string, unknown>[]> {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("未設定 FMP_API_KEY");
  const qs = new URLSearchParams({ symbol, apikey: key });
  const res = await fetch(`https://financialmodelingprep.com/stable/${path}?${qs}`, { next: { revalidate: CACHE_SECONDS } });
  const json = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(json)) throw new Error(`${path}: ${(json && (json["Error Message"] || json.message)) ?? "HTTP " + res.status}`);
  return json;
}

/** GET /api/analysts?symbol=NVDA：美股分析師評等分布、目標價與近期評等異動（FMP） */
export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").toUpperCase();
  if (!/^[A-Z0-9.\-]{1,10}$/.test(symbol)) return NextResponse.json({ error: "symbol 格式錯誤" }, { status: 400 });

  const [cons, target, grades] = await Promise.allSettled([
    fmp("grades-consensus", symbol), fmp("price-target-consensus", symbol), fmp("grades", symbol),
  ]);
  const errors: string[] = [];
  const out: {
    symbol: string;
    consensus: null | { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; rating: string };
    target: null | { high: number | null; low: number | null; consensus: number | null; median: number | null };
    grades: { date: string; firm: string; from: string; to: string; action: string }[];
    errors: string[];
  } = { symbol, consensus: null, target: null, grades: [], errors };

  if (cons.status === "fulfilled" && cons.value[0]) {
    const c = cons.value[0];
    out.consensus = {
      strongBuy: num(c.strongBuy) ?? 0, buy: num(c.buy) ?? 0, hold: num(c.hold) ?? 0,
      sell: num(c.sell) ?? 0, strongSell: num(c.strongSell) ?? 0, rating: String(c.consensus ?? ""),
    };
  } else if (cons.status === "rejected") errors.push(String(cons.reason?.message ?? cons.reason));

  if (target.status === "fulfilled" && target.value[0]) {
    const t = target.value[0];
    out.target = { high: num(t.targetHigh), low: num(t.targetLow), consensus: num(t.targetConsensus), median: num(t.targetMedian) };
  } else if (target.status === "rejected") errors.push(String(target.reason?.message ?? target.reason));

  if (grades.status === "fulfilled") {
    out.grades = grades.value
      .map((g) => ({ date: String(g.date ?? "").slice(0, 10), firm: String(g.gradingCompany ?? ""), from: String(g.previousGrade ?? ""), to: String(g.newGrade ?? ""), action: String(g.action ?? "") }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  } else errors.push(String(grades.reason?.message ?? grades.reason));

  return NextResponse.json(out);
}
