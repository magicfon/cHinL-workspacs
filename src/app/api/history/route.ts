import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type Series = { dates: string[]; closes: number[]; currency: string } | { error: string };

async function history(symbol: string): Promise<Series> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.replace(".", "-"))}?interval=1d&range=1y`,
      { headers: { "User-Agent": UA }, next: { revalidate: 6 * 60 * 60 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const r = (await res.json())?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const cl: (number | null)[] = r?.indicators?.quote?.[0]?.close ?? [];
    const dates: string[] = [];
    const closes: number[] = [];
    ts.forEach((t, i) => {
      const c = cl[i];
      if (typeof c === "number" && Number.isFinite(c)) {
        dates.push(new Date(t * 1000).toISOString().slice(0, 10));
        closes.push(Math.round(c * 100) / 100);
      }
    });
    if (!closes.length) throw new Error("查無股價資料");
    return { dates, closes, currency: r?.meta?.currency ?? "USD" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "查詢失敗" };
  }
}

/**
 * GET /api/history?symbols=NVDA,MU（最多 40 檔）
 * 美股近一年日收盤價（Yahoo Finance chart，非官方），回傳 { series: { [symbol]: { dates, closes, currency } | { error } } }
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? req.nextUrl.searchParams.get("symbol") ?? "";
  const symbols = Array.from(new Set(raw.toUpperCase().split(",").map((s) => s.trim()).filter((s) => /^[A-Z0-9.\-]{1,10}$/.test(s)))).slice(0, 40);
  if (!symbols.length) return NextResponse.json({ error: "symbols 格式錯誤" }, { status: 400 });
  const out: Record<string, Series> = {};
  await Promise.all(symbols.map(async (s) => { out[s] = await history(s); }));
  return NextResponse.json({ series: out }, { headers: { "Cache-Control": "s-maxage=21600" } });
}
