import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Yahoo exchangeName → TradingView 交易所前綴
const EXCHANGE: Record<string, string> = {
  NMS: "NASDAQ", NGM: "NASDAQ", NCM: "NASDAQ", NAS: "NASDAQ",
  NYQ: "NYSE", NYS: "NYSE",
  ASE: "AMEX", AMX: "AMEX", PCX: "AMEX",
  BTS: "CBOE", CXI: "CBOE",
  PNK: "OTC", OQB: "OTC", OQX: "OTC", OEM: "OTC", OBB: "OTC",
};
// Yahoo 查不到或不是股票的代號
const FIXED: Record<string, string> = {
  BTC: "COINBASE:BTCUSD", ETH: "COINBASE:ETHUSD", SOL: "COINBASE:SOLUSD", XRP: "COINBASE:XRPUSD", DOGE: "COINBASE:DOGEUSD",
  VIX: "TVC:VIX", KOSPI: "KRX:KOSPI", SPX: "SP:SPX", NDX: "NASDAQ:NDX",
};

async function resolve(symbol: string): Promise<string | null> {
  if (FIXED[symbol]) return FIXED[symbol];
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.replace(".", "-"))}?interval=1d&range=1d`,
      { headers: { "User-Agent": UA }, next: { revalidate: 7 * 24 * 60 * 60 } }
    );
    if (!res.ok) return null;
    const ex: string | undefined = (await res.json())?.chart?.result?.[0]?.meta?.exchangeName;
    return ex && EXCHANGE[ex] ? `${EXCHANGE[ex]}:${symbol}` : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/tradingview  { symbols: ["MU","NVDA"] }（最多 400 檔）
 * 回傳 { map: { MU: "NASDAQ:MU", XYZ: null } }，null 代表查不到交易所，前端就只放代號。
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const list: unknown[] = Array.isArray(body?.symbols) ? body.symbols : [];
  const symbols = Array.from(new Set(list.map((s) => String(s).toUpperCase().trim()).filter((s) => /^[A-Z0-9.\-]{1,10}$/.test(s)))).slice(0, 400);
  if (!symbols.length) return NextResponse.json({ error: "symbols 格式錯誤" }, { status: 400 });
  const map: Record<string, string | null> = {};
  let i = 0;
  const worker = async () => {
    while (i < symbols.length) {
      const s = symbols[i++];
      map[s] = await resolve(s);
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  return NextResponse.json({ map });
}
