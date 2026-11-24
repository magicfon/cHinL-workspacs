import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/taifex?range=1y   （3m | 6m | 1y | 3y）
 * 期交所「三大法人－區分各期貨契約」每日資料（外資／投信／自營商的買賣超與未平倉），
 * 核心商品：美國費城半導體期貨 SXF、美國那斯達克100期貨 UNF；另附標普500、道瓊、臺股期貨供對照。
 * 另抓「大額交易人未沖銷部位」近一個月的前五／前十大交易人與全市場未平倉，
 * 以及 Yahoo 的費半 ^SOX、那指 ^NDX、加權 ^TWII 收盤價。
 * 期交所資料只有一般交易時段收盤後的部位，約下午 3 點後公布當天資料。
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BASE = "https://www.taifex.com.tw/cht/3/";

// 商品名稱（期交所 CSV 的「商品名稱」）→ 代號
const PRODUCTS: Record<string, { id: string; name: string; index?: string; core?: boolean }> = {
  美國費城半導體期貨: { id: "SXF", name: "費城半導體期貨", index: "^SOX", core: true },
  美國那斯達克100期貨: { id: "UNF", name: "那斯達克100期貨", index: "^NDX", core: true },
  美國標普500期貨: { id: "SPF", name: "標普500期貨", index: "^GSPC" },
  美國道瓊期貨: { id: "UDF", name: "道瓊期貨", index: "^DJI" },
  臺股期貨: { id: "TXF", name: "臺股期貨", index: "^TWII" },
};
const IDS = new Set(Object.values(PRODUCTS).map((p) => p.id));
const LT_IDS = new Set(["SXF", "UNF", "SPF", "UDF", "TX"]);

type Who = "foreign" | "trust" | "dealer";
// [date, tradeNet口, tradeNet金額(千元), longOI, shortOI, netOI口, netOI金額(千元)]
type Row = [string, number, number, number, number, number, number];
type ProductRows = Record<string, Partial<Record<Who, Row[]>>>;

const n = (s: string | undefined) => {
  const v = parseFloat((s ?? "").replace(/[,\s]/g, ""));
  return Number.isFinite(v) ? v : 0;
};
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const slash = (s: string) => s.replace(/-/g, "/");

async function taifex(path: string, params: Record<string, string>): Promise<string> {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded", Referer: BASE + "futContractsDate" },
    body: new URLSearchParams(params).toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`期交所 HTTP ${res.status}`);
  const text = new TextDecoder("big5").decode(await res.arrayBuffer());
  if (/<html|<!DOCTYPE/i.test(text.slice(0, 300))) throw new Error("期交所回傳錯誤頁（查詢區間或參數不被接受）");
  return text;
}

/* ---- 三大法人：區分各期貨契約（一次抓全部商品，再挑需要的） ---- */
const contracts = unstable_cache(
  async (start: string, end: string): Promise<ProductRows> => {
    const text = await taifex("futContractsDateDown", { queryStartDate: slash(start), queryEndDate: slash(end), commodityId: "" });
    const out: ProductRows = {};
    for (const line of text.split(/\r?\n/).slice(1)) {
      const c = line.split(",");
      if (c.length < 15) continue;
      const p = PRODUCTS[c[1].trim()];
      if (!p) continue;
      const who: Who | null = c[2].includes("外資") ? "foreign" : c[2].includes("投信") ? "trust" : c[2].includes("自營") ? "dealer" : null;
      if (!who) continue;
      const row: Row = [c[0].trim().replace(/\//g, "-"), n(c[7]), n(c[8]), n(c[9]), n(c[11]), n(c[13]), n(c[14])];
      ((out[p.id] ??= {})[who] ??= []).push(row);
    }
    for (const p of Object.values(out)) for (const k of Object.keys(p) as Who[]) p[k]!.sort((a, b) => a[0].localeCompare(b[0]));
    return out;
  },
  ["taifex-contracts-v1"],
  { revalidate: 1800 }
);

/* ---- 大額交易人未沖銷部位（近一個月，所有月份合計 999999） ---- */
type LTRow = { date: string; top5Buy: number; top5Sell: number; top10Buy: number; top10Sell: number; inst5Buy: number; inst5Sell: number; inst10Buy: number; inst10Sell: number; oi: number };
const largeTraders = unstable_cache(
  async (start: string, end: string): Promise<Record<string, LTRow[]>> => {
    const text = await taifex("largeTraderFutDown", { queryStartDate: slash(start), queryEndDate: slash(end) });
    const map: Record<string, Record<string, LTRow>> = {};
    for (const line of text.split(/\r?\n/)) {
      const c = line.split(",");
      if (c.length < 10) continue;
      const id = c[1].trim();
      if (!LT_IDS.has(id) || c[3].trim() !== "999999") continue;
      const date = c[0].trim().replace(/\//g, "-");
      const r = ((map[id] ??= {})[date] ??= { date, top5Buy: 0, top5Sell: 0, top10Buy: 0, top10Sell: 0, inst5Buy: 0, inst5Sell: 0, inst10Buy: 0, inst10Sell: 0, oi: n(c[9]) });
      if (c[4].trim() === "0") Object.assign(r, { top5Buy: n(c[5]), top5Sell: n(c[6]), top10Buy: n(c[7]), top10Sell: n(c[8]) });
      else Object.assign(r, { inst5Buy: n(c[5]), inst5Sell: n(c[6]), inst10Buy: n(c[7]), inst10Sell: n(c[8]) });
    }
    const out: Record<string, LTRow[]> = {};
    for (const [id, m] of Object.entries(map)) out[id === "TX" ? "TXF" : id] = Object.values(m).sort((a, b) => a.date.localeCompare(b.date));
    return out;
  },
  ["taifex-largetrader-v1"],
  { revalidate: 1800 }
);

/* ---- 指數收盤（Yahoo，非官方） ---- */
const indexHistory = unstable_cache(
  async (symbol: string, range: string): Promise<[string, number][]> => {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`, {
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
    const r = (await res.json())?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const cl: (number | null)[] = r?.indicators?.quote?.[0]?.close ?? [];
    const off = (r?.meta?.gmtoffset ?? 0) * 1000;
    const out: [string, number][] = [];
    ts.forEach((t, i) => {
      const c = cl[i];
      if (typeof c === "number" && Number.isFinite(c)) out.push([new Date(t * 1000 + off).toISOString().slice(0, 10), Math.round(c * 100) / 100]);
    });
    return out;
  },
  ["yahoo-index-v1"],
  { revalidate: 3600 }
);

/* ---- 判讀：用外資淨未平倉的變化相對於過去一年的波動來判斷 ---- */
type Signal = { label: "偏多" | "偏空" | "中性"; score: number; reasons: string[] };

function std(a: number[]) {
  if (a.length < 2) return 0;
  const m = a.reduce((s, v) => s + v, 0) / a.length;
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}
const fmt = (v: number) => (v > 0 ? "+" : "") + Math.round(v).toLocaleString("en-US");
const lab = (s: number): Signal["label"] => (s > 0 ? "偏多" : s < 0 ? "偏空" : "中性");

function judge(rows: Row[], lt?: LTRow[]) {
  const net = rows.map((r) => r[5]);
  const last = net.length - 1;
  if (last < 1) return null;
  const diff = (k: number) => (last >= k ? net[last] - net[last - k] : NaN);
  const year = net.slice(-250);
  const ch = (k: number) => year.slice(k).map((v, i) => v - year[i]);
  const s5 = std(ch(5)), s20 = std(ch(20));
  const d1 = diff(1), d5 = diff(5), d20 = diff(20);

  // 短線：近 5 日淨未平倉變化 + 今日淨買賣
  let sScore = 0;
  const sR: string[] = [];
  if (Number.isFinite(d5) && s5 > 0) {
    const z = d5 / s5;
    sScore += z > 0.5 ? 1 : z < -0.5 ? -1 : 0;
    sR.push(`近 5 日外資淨未平倉 ${fmt(d5)} 口（約 ${z.toFixed(1)} 個標準差）`);
  }
  const t = rows[last][1];
  if (t !== 0) {
    sR.push(`今日外資淨${t > 0 ? "買" : "賣"} ${Math.abs(t).toLocaleString("en-US")} 口，未平倉 ${fmt(d1)} 口`);
    if (Math.sign(t) === Math.sign(d1) && Math.abs(d1) >= s5 / 2) sScore += Math.sign(d1);
  }

  // 中線：近 20 日變化 + 前十大特定法人
  let mScore = 0;
  const mR: string[] = [];
  if (Number.isFinite(d20) && s20 > 0) {
    const z = d20 / s20;
    mScore += z > 0.5 ? 1 : z < -0.5 ? -1 : 0;
    mR.push(`近 20 日外資淨未平倉 ${fmt(d20)} 口（約 ${z.toFixed(1)} 個標準差）`);
  }
  const ma20 = net.slice(-20).reduce((s, v) => s + v, 0) / Math.min(20, net.length);
  mR.push(`目前 ${fmt(net[last])} 口，${net[last] >= ma20 ? "高於" : "低於"} 20 日均值 ${fmt(ma20)} 口`);
  if (lt && lt.length >= 2) {
    const a = lt[0], b = lt[lt.length - 1];
    const na = a.inst10Buy - a.inst10Sell, nb = b.inst10Buy - b.inst10Sell;
    mR.push(`前十大特定法人淨部位 ${fmt(na)} → ${fmt(nb)} 口（${a.date.slice(5)} 起）`);
    if (Math.abs(nb - na) >= Math.max(1, b.oi * 0.05)) mScore += Math.sign(nb - na);
  }

  // 長線：淨部位在一年內的位置
  let lScore = 0;
  const lR: string[] = [];
  const sorted = [...year].sort((a, b) => a - b);
  const pct = sorted.filter((v) => v <= net[last]).length / sorted.length;
  lScore = pct >= 0.7 ? 1 : pct <= 0.3 ? -1 : 0;
  lR.push(`淨未平倉位於近一年 ${Math.round(pct * 100)} 百分位（區間 ${fmt(sorted[0])} ～ ${fmt(sorted[sorted.length - 1])} 口）`);
  lR.push(`外資目前為淨${net[last] > 0 ? "多單" : net[last] < 0 ? "空單" : "零"}${net[last] ? " " + Math.abs(net[last]).toLocaleString("en-US") + " 口" : ""}`);
  if (lt?.length) {
    const b = lt[lt.length - 1];
    const fOI = rows[last][3] + rows[last][4];
    if (b.oi) lR.push(`外資多空未平倉合計占全市場 ${Math.round((fOI / (2 * b.oi)) * 100)}%（全市場 ${b.oi.toLocaleString("en-US")} 口）`);
  }

  const cap = (s: number) => Math.max(-2, Math.min(2, s));
  return {
    short: { label: lab(sScore), score: cap(sScore), reasons: sR } as Signal,
    mid: { label: lab(mScore), score: cap(mScore), reasons: mR } as Signal,
    long: { label: lab(lScore), score: lScore, reasons: lR } as Signal,
    stats: { net: net[last], d1, d5, d20, ma20, pct, sd5: s5, sd20: s20 },
  };
}

const RANGES: Record<string, { days: number; yahoo: string }> = {
  "3m": { days: 92, yahoo: "6mo" },
  "6m": { days: 183, yahoo: "1y" },
  "1y": { days: 366, yahoo: "2y" },
  "3y": { days: 1096, yahoo: "5y" },
};

export async function GET(req: NextRequest) {
  const rk = RANGES[req.nextUrl.searchParams.get("range") ?? "1y"] ? req.nextUrl.searchParams.get("range") ?? "1y" : "1y";
  const now = new Date(Date.now() + 8 * 3600e3); // 台北日期
  const end = ymd(now);
  // 判讀一律用至少一年的資料，圖表再依 range 截取
  const fetchDays = Math.max(RANGES[rk].days, 366) + 40;
  const start = ymd(new Date(now.getTime() - fetchDays * 86400e3));
  const ltStart = ymd(new Date(now.getTime() - 30 * 86400e3));
  const chartFrom = ymd(new Date(now.getTime() - RANGES[rk].days * 86400e3));

  const errors: string[] = [];
  const [rows, lt] = await Promise.all([
    contracts(start, end).catch((e) => (errors.push("三大法人：" + (e as Error).message), {} as ProductRows)),
    largeTraders(ltStart, end).catch((e) => (errors.push("大額交易人：" + (e as Error).message), {} as Record<string, LTRow[]>)),
  ]);
  const idx: Record<string, [string, number][]> = {};
  await Promise.all(
    Object.values(PRODUCTS).map(async (p) => {
      if (!p.index) return;
      idx[p.id] = await indexHistory(p.index, RANGES[rk].yahoo).catch(() => (errors.push(`${p.index} 收盤：讀取失敗`), []));
    })
  );

  const products = Object.values(PRODUCTS).map((p) => {
    const r = rows[p.id] ?? {};
    const f = r.foreign ?? [];
    const cut = (a?: Row[]) => (a ?? []).filter((x) => x[0] >= chartFrom);
    return {
      id: p.id,
      name: p.name,
      core: !!p.core,
      index: p.index,
      foreign: cut(f),
      trust: cut(r.trust),
      dealer: cut(r.dealer),
      largeTraders: lt[p.id] ?? [],
      indexClose: (idx[p.id] ?? []).filter((x) => x[0] >= chartFrom),
      signal: judge(f, lt[p.id]),
    };
  });

  const latest = products.flatMap((p) => p.foreign.slice(-1).map((r) => r[0])).sort().pop() ?? null;
  return NextResponse.json(
    {
      asOf: latest,
      range: rk,
      columns: ["date", "tradeNet", "tradeNetAmt", "longOI", "shortOI", "netOI", "netOIAmt"],
      products,
      errors,
      source: "臺灣期貨交易所 三大法人－區分各期貨契約、大額交易人未沖銷部位；指數收盤 Yahoo Finance",
    },
    { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } }
  );
}
