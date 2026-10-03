import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CACHE_SECONDS = 6 * 60 * 60; // 財報與比率變動慢，快取 6 小時，節省免費額度

type Fields = Partial<{
  pe: number; pb: number; roe: number; grossMargin: number; revGrowth: number; epsGrowth: number;
  dividendYield: number; debtRatio: number; beta: number;
}>;
type Result = { fields: Fields; prices: number[]; target: number | null; asOf: string; real: string[]; errors: string[] };

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};
const r2 = (v: number | null, k = 1) => (v == null ? undefined : Math.round(v * 10 ** k) / 10 ** k);
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

/* ---------------- FinMind（台股） ---------------- */
async function finmind(dataset: string, id: string, start: string): Promise<Record<string, unknown>[]> {
  const token = process.env.FINMIND_TOKEN;
  if (!token) throw new Error("未設定 FINMIND_TOKEN");
  const url = `https://api.finmindtrade.com/api/v4/data?dataset=${dataset}&data_id=${id}&start_date=${start}&token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || (json.status && json.status !== 200)) throw new Error(`${dataset}: ${json?.msg ?? "HTTP " + res.status}`);
  return json.data ?? [];
}

function byDate(rows: Record<string, unknown>[]) {
  const m = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const d = String(r.date), t = String(r.type), v = num(r.value);
    if (v == null) continue;
    if (!m.has(d)) m.set(d, {});
    m.get(d)![t] = v;
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

async function taiwan(id: string): Promise<Result> {
  const out: Result = { fields: {}, prices: [], target: null, asOf: "", real: [], errors: [] };
  const [price, per, income, balance] = await Promise.allSettled([
    finmind("TaiwanStockPrice", id, daysAgo(280)),
    finmind("TaiwanStockPER", id, daysAgo(10)),
    finmind("TaiwanStockFinancialStatements", id, daysAgo(1200)),
    finmind("TaiwanStockBalanceSheet", id, daysAgo(400)),
  ]);
  const fail = (r: PromiseRejectedResult) => out.errors.push(String(r.reason?.message ?? r.reason));

  if (price.status === "fulfilled" && price.value.length) {
    const rows = price.value.filter((r) => num(r.close) != null);
    out.prices = rows.slice(-180).map((r) => num(r.close) as number);
    out.asOf = String(rows[rows.length - 1]?.date ?? "");
    out.real.push("股價走勢");
  } else if (price.status === "rejected") fail(price);

  if (per.status === "fulfilled" && per.value.length) {
    const last = per.value[per.value.length - 1];
    const pe = num(last.PER), pb = num(last.PBR), dy = num(last.dividend_yield);
    if (pe) out.fields.pe = r2(pe);
    if (pb) out.fields.pb = r2(pb);
    if (dy != null) out.fields.dividendYield = r2(dy);
    out.real.push("本益比/淨值比/殖利率");
  } else if (per.status === "rejected") fail(per);

  if (income.status === "fulfilled" && income.value.length) {
    const q = byDate(income.value);
    const last = q[q.length - 1];
    if (last) {
      const [d, cur] = last;
      const prevYear = `${Number(d.slice(0, 4)) - 1}${d.slice(4)}`;
      const prior = q.find(([x]) => x === prevYear)?.[1];
      if (cur.Revenue && cur.GrossProfit) out.fields.grossMargin = r2((cur.GrossProfit / cur.Revenue) * 100);
      if (prior?.Revenue && cur.Revenue) out.fields.revGrowth = r2((cur.Revenue / prior.Revenue - 1) * 100);
      if (prior?.EPS && prior.EPS > 0 && cur.EPS != null) out.fields.epsGrowth = r2((cur.EPS / prior.EPS - 1) * 100);
      // ROE = 近四季稅後淨利 ÷ 最新權益
      const ttm = q.slice(-4).map(([, v]) => v.IncomeAfterTaxes);
      if (balance.status === "fulfilled" && ttm.length === 4 && ttm.every((x) => x != null)) {
        const b = byDate(balance.value).pop()?.[1];
        const eq = b?.EquityAttributableToOwnersOfParent ?? b?.Equity;
        if (eq) out.fields.roe = r2((ttm.reduce((a, x) => a + x, 0) / eq) * 100);
      }
      out.real.push(`財報（${d}）`);
    }
  } else if (income.status === "rejected") fail(income);

  if (balance.status === "fulfilled" && balance.value.length) {
    const b = byDate(balance.value).pop()?.[1];
    if (b?.Liabilities && b?.TotalAssets) out.fields.debtRatio = r2((b.Liabilities / b.TotalAssets) * 100);
  } else if (balance.status === "rejected") fail(balance);
  return out;
}

/* ---------------- FMP（美股） ---------------- */
async function fmp(path: string, params: Record<string, string>): Promise<Record<string, unknown>[]> {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("未設定 FMP_API_KEY");
  const qs = new URLSearchParams({ ...params, apikey: key });
  const res = await fetch(`https://financialmodelingprep.com/stable/${path}?${qs}`, { next: { revalidate: CACHE_SECONDS } });
  const json = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(json)) throw new Error(`${path}: ${(json && (json["Error Message"] || json.message)) ?? "HTTP " + res.status}`);
  return json;
}

async function us(symbol: string): Promise<Result> {
  const out: Result = { fields: {}, prices: [], target: null, asOf: "", real: [], errors: [] };
  const s = { symbol };
  const [ratios, metrics, growth, profile, target, hist] = await Promise.allSettled([
    fmp("ratios-ttm", s), fmp("key-metrics-ttm", s), fmp("financial-growth", { ...s, limit: "1" }),
    fmp("profile", s), fmp("price-target-consensus", s), fmp("historical-price-eod/light", { ...s, from: daysAgo(280) }),
  ]);
  const fail = (r: PromiseRejectedResult) => out.errors.push(String(r.reason?.message ?? r.reason));
  const pct = (v: unknown) => { const n = num(v); return n == null ? undefined : r2(n * 100); };

  if (ratios.status === "fulfilled" && ratios.value[0]) {
    const r = ratios.value[0];
    const pe = num(r.priceToEarningsRatioTTM), pb = num(r.priceToBookRatioTTM);
    if (pe && pe > 0) out.fields.pe = r2(pe);
    if (pb && pb > 0) out.fields.pb = r2(pb);
    out.fields.grossMargin = pct(r.grossProfitMarginTTM);
    out.fields.dividendYield = pct(r.dividendYieldTTM);
    out.fields.debtRatio = pct(r.debtToAssetsRatioTTM);
    out.real.push("估值與獲利比率");
  } else if (ratios.status === "rejected") fail(ratios);

  if (metrics.status === "fulfilled" && metrics.value[0]) out.fields.roe = pct(metrics.value[0].returnOnEquityTTM);
  else if (metrics.status === "rejected") fail(metrics);

  if (growth.status === "fulfilled" && growth.value[0]) {
    out.fields.revGrowth = pct(growth.value[0].revenueGrowth);
    out.fields.epsGrowth = pct(growth.value[0].epsgrowth ?? growth.value[0].epsGrowth);
    out.real.push("成長率（年度）");
  } else if (growth.status === "rejected") fail(growth);

  if (profile.status === "fulfilled" && profile.value[0]) {
    const b = num(profile.value[0].beta);
    if (b != null) out.fields.beta = r2(b, 2);
  } else if (profile.status === "rejected") fail(profile);

  if (target.status === "fulfilled" && target.value[0]) {
    out.target = num(target.value[0].targetConsensus);
    if (out.target) out.real.push("分析師共識目標價");
  } else if (target.status === "rejected") fail(target);

  if (hist.status === "fulfilled" && hist.value.length) {
    const rows = hist.value.map((r) => ({ d: String(r.date), p: num(r.price ?? r.close) })).filter((r) => r.p != null).sort((a, b) => a.d.localeCompare(b.d));
    out.prices = rows.slice(-180).map((r) => r.p as number);
    out.asOf = rows[rows.length - 1]?.d ?? "";
    out.real.push("股價走勢");
  } else if (hist.status === "rejected") fail(hist);

  for (const k of Object.keys(out.fields) as (keyof Fields)[]) if (out.fields[k] === undefined) delete out.fields[k];
  return out;
}

/** GET /api/fundamentals?symbol=TW:2330 或 US:NVDA */
export async function GET(req: NextRequest) {
  const [mk, sym] = (req.nextUrl.searchParams.get("symbol") ?? "").split(":");
  if (!/^[A-Za-z0-9.\-]{1,10}$/.test(sym ?? "") || (mk !== "TW" && mk !== "US")) {
    return NextResponse.json({ error: "symbol 格式應為 TW:2330 或 US:NVDA" }, { status: 400 });
  }
  try {
    const data = mk === "TW" ? await taiwan(sym) : await us(sym.toUpperCase());
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "查詢失敗" }, { status: 502 });
  }
}
