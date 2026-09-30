import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type Quote = {
  price: number;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  time: string; // ISO
  source: "twse-mis" | "yahoo";
  stale: boolean; // true when no trade yet today (price fell back to a quote or prior close)
};

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

function withChange(price: number, prev: number | null) {
  const change = prev != null ? price - prev : null;
  return { change, changePct: prev ? (price - prev) / prev : null };
}

/* ---- 台股：證交所 MIS 即時行情（上市 tse、上櫃 otc 都查，回傳有資料的那個） ---- */
let misCookie = "";
async function misSession() {
  if (misCookie) return misCookie;
  const res = await fetch("https://mis.twse.com.tw/stock/index.jsp", {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  misCookie = (res.headers.get("set-cookie") || "").split(";")[0];
  return misCookie;
}

async function fetchTw(symbols: string[], out: Record<string, Quote>, errors: Record<string, string>) {
  if (!symbols.length) return;
  const ex = symbols.flatMap((s) => [`tse_${s}.tw`, `otc_${s}.tw`]).join("|");
  const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(ex)}&json=1&delay=0&_=${Date.now()}`;
  const call = async () =>
    fetch(url, {
      headers: { "User-Agent": UA, Referer: "https://mis.twse.com.tw/stock/index.jsp", Cookie: await misSession() },
      cache: "no-store",
    });
  let res = await call();
  if (!res.ok) {
    misCookie = "";
    res = await call();
  }
  if (!res.ok) throw new Error(`TWSE MIS HTTP ${res.status}`);
  const json = await res.json();
  for (const m of json.msgArray ?? []) {
    const code: string = m.c;
    const prev = num(m.y);
    let price = num(m.z);
    let stale = false;
    if (price == null) {
      // 尚無成交（開盤前或剛開盤）：改用最佳委買/委賣，再不行用昨收
      price = num(String(m.b ?? "").split("_")[0]) ?? num(String(m.a ?? "").split("_")[0]) ?? prev;
      stale = true;
    }
    if (price == null) continue;
    const d: string = m.d ?? "";
    const t: string = m.t ?? "00:00:00";
    const iso = d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${t}+08:00` : new Date().toISOString();
    out[code] = { price, prevClose: prev, ...withChange(price, prev), time: iso, source: "twse-mis", stale };
  }
  for (const s of symbols) if (!out[s]) errors[s] = "證交所查無此代號或暫無資料";
}

/* ---- 美股：Yahoo Finance chart（非官方，可能延遲或被限流） ---- */
async function fetchUs(symbol: string, out: Record<string, Quote>, errors: Record<string, string>) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
      { headers: { "User-Agent": UA }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const meta = (await res.json())?.chart?.result?.[0]?.meta;
    const price = num(meta?.regularMarketPrice);
    if (price == null) throw new Error("無報價");
    const prev = num(meta?.chartPreviousClose) ?? num(meta?.previousClose);
    const ts = num(meta?.regularMarketTime);
    out[symbol] = {
      price,
      prevClose: prev,
      ...withChange(price, prev),
      time: ts ? new Date(ts * 1000).toISOString() : new Date().toISOString(),
      source: "yahoo",
      stale: false,
    };
  } catch (e) {
    errors[symbol] = e instanceof Error ? e.message : "查詢失敗";
  }
}

/**
 * GET /api/quotes?symbols=TW:2330,TW:2454,US:NVDA
 * 回傳 { quotes: { [ticker]: Quote }, errors: { [ticker]: string }, fetchedAt }
 */
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("symbols") ?? "").split(",").filter(Boolean).slice(0, 40);
  const tw: string[] = [];
  const us: string[] = [];
  for (const item of raw) {
    const [mk, sym] = item.split(":");
    if (!/^[A-Za-z0-9.\-]{1,10}$/.test(sym ?? "")) continue;
    (mk === "TW" ? tw : mk === "US" ? us : []).push(sym.toUpperCase());
  }
  const quotes: Record<string, Quote> = {};
  const errors: Record<string, string> = {};
  await Promise.all([
    fetchTw(tw, quotes, errors).catch((e) => {
      for (const s of tw) errors[s] = e instanceof Error ? e.message : "台股報價失敗";
    }),
    ...us.map((s) => fetchUs(s, quotes, errors)),
  ]);
  return NextResponse.json({ quotes, errors, fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
