import { TwseApiResponse } from "@/types/twse";

const TWSE_BASE_URL = "https://www.twse.com.tw";

// 請求間隔，避免被封鎖
const REQUEST_DELAY_MS = 500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTwse<T = TwseApiResponse>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  await delay(REQUEST_DELAY_MS);

  const url = new URL(`${TWSE_BASE_URL}${path}`);
  // 加上時間戳避免快取
  params["_"] = Date.now().toString();
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.twse.com.tw/",
      "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    next: { revalidate: 60 }, // 快取 60 秒
  });

  if (!res.ok) {
    throw new Error(`TWSE API 請求失敗: HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (json.stat && json.stat !== "OK" && json.stat !== "ok") {
    throw new Error(`TWSE API 回傳錯誤: ${json.stat}`);
  }

  return json as T;
}

// 個股即時行情：使用 exchangeReport/STOCK_DAY_ALL 或 REALTIME
export async function fetchStockQuote(symbol: string): Promise<TwseApiResponse> {
  // 使用 /api/exchangeReport/STOCK_DAY_ALL 獲取所有股票當日資料
  // 但我們需要個股，改用 tse_stock.php
  const today = getTodayString();
  return fetchTwse<TwseApiResponse>("/rwd/zh/afterTrading/STOCK_DAY", {
    stockNo: symbol,
    date: today,
    response: "json",
  });
}

// 三大法人：當日三大法人買賣超彙總
export async function fetchInstitutional(): Promise<TwseApiResponse> {
  const today = getTodayString();
  return fetchTwse<TwseApiResponse>("/rwd/zh/fund/T86", {
    date: today,
    selectType: "ALLBUT0999",
    response: "json",
  });
}

// 融資融券餘額
export async function fetchMarginTrading(): Promise<TwseApiResponse> {
  const today = getTodayString();
  return fetchTwse<TwseApiResponse>("/rwd/zh/marginTrading/MI_MARGN", {
    date: today,
    selectType: "ALL",
    response: "json",
  });
}

// 個股月歷史資料
export async function fetchStockHistory(
  symbol: string,
  year: string,
  month: string
): Promise<TwseApiResponse> {
  const dateStr = `${year}${month.padStart(2, "0")}01`;
  return fetchTwse<TwseApiResponse>("/rwd/zh/afterTrading/STOCK_DAY", {
    stockNo: symbol,
    date: dateStr,
    response: "json",
  });
}

// 取得今日日期字串 YYYYMMDD
export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// 將數字字串中的逗號移除並轉換
export function parseNumber(str: string): number {
  if (!str || str === "--" || str === "-") return 0;
  return parseFloat(str.replace(/,/g, "")) || 0;
}

// 處理漲跌幅字串（如 +1.23 或 -0.50）
export function parseChange(str: string): number {
  if (!str || str === "--" || str === "X") return 0;
  return parseFloat(str.replace(/,/g, "")) || 0;
}
