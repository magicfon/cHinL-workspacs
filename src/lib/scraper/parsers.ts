import {
  StockQuote,
  InstitutionalInvestors,
  MarginTrading,
  HistoricalData,
  TwseApiResponse,
} from "@/types/twse";
import { parseNumber, parseChange } from "./twseClient";

// 解析個股當日行情（STOCK_DAY 最後一筆即為最新資料）
export function parseStockQuote(
  symbol: string,
  raw: TwseApiResponse
): StockQuote {
  if (!raw.data || raw.data.length === 0) {
    throw new Error(`查無股票 ${symbol} 的資料`);
  }

  // STOCK_DAY 的欄位順序：
  // 日期, 成交股數, 成交金額, 開盤價, 最高價, 最低價, 收盤價, 漲跌價差, 成交筆數
  const last = raw.data[raw.data.length - 1];
  const [date, volume, value, open, high, low, close, change, transactions] = last;

  const closeNum = parseNumber(close);
  const changeNum = parseChange(change);
  const yesterdayClose = closeNum - changeNum;
  const changePercent =
    yesterdayClose !== 0 ? (changeNum / yesterdayClose) * 100 : 0;

  // 從 title 解析股票名稱（格式：XXX 個股日成交資訊）
  const nameMatch = raw.title?.match(/(\S+)\s+個股/);
  const name = nameMatch ? nameMatch[1] : symbol;

  return {
    symbol,
    name,
    date: formatDate(date),
    time: "",
    openPrice: parseNumber(open),
    highPrice: parseNumber(high),
    lowPrice: parseNumber(low),
    closePrice: closeNum,
    change: changeNum,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: parseNumber(volume),
    value: parseNumber(value),
    transactions: parseNumber(transactions),
    yesterdayClose,
    buyPrice: 0,
    sellPrice: 0,
    fiftyTwoWeekHigh: 0,
    fiftyTwoWeekLow: 0,
  };
}

// 解析三大法人買賣超（T86）
// 欄位：證券代號, 證券名稱, 外陸資買進, 外陸資賣出, 外陸資淨買賣, 外資自營商買進, 外資自營商賣出, 外資自營商淨買賣,
//       投信買進, 投信賣出, 投信淨買賣, 自營商買進, 自營商賣出, 自營商淨買賣, 自營商(避險)買進, 自營商(避險)賣出, 自營商(避險)淨買賣, 三大法人買賣超股數
export function parseInstitutional(
  raw: TwseApiResponse
): InstitutionalInvestors[] {
  if (!raw.data || raw.data.length === 0) {
    return [];
  }

  return raw.data.map((row) => {
    const [
      symbol,
      name,
      foreignBuy,
      foreignSell,
      foreignNet,
      _fSelfBuy,
      _fSelfSell,
      _fSelfNet,
      trustBuy,
      trustSell,
      trustNet,
      dealerBuy,
      dealerSell,
      dealerNet,
      _hedgeBuy,
      _hedgeSell,
      _hedgeNet,
      totalNet,
    ] = row;

    return {
      date: formatDate(raw.date),
      symbol,
      name,
      foreignBuy: parseNumber(foreignBuy),
      foreignSell: parseNumber(foreignSell),
      foreignNet: parseNumber(foreignNet),
      investmentTrustBuy: parseNumber(trustBuy),
      investmentTrustSell: parseNumber(trustSell),
      investmentTrustNet: parseNumber(trustNet),
      dealerBuy: parseNumber(dealerBuy),
      dealerSell: parseNumber(dealerSell),
      dealerNet: parseNumber(dealerNet),
      totalNet: parseNumber(totalNet),
    };
  });
}

// 解析融資融券餘額（MI_MARGN）
// 欄位（融資）：股票代號, 名稱, 前日餘額, 買進, 賣出, 現金償還, 今日餘額, 限額
// 欄位（融券）：前日餘額, 賣出, 買進, 現券償還, 今日餘額, 限額
// 欄位：資券互抵, 備註
export function parseMarginTrading(raw: TwseApiResponse): MarginTrading[] {
  if (!raw.data || raw.data.length === 0) {
    return [];
  }

  return raw.data
    .filter((row) => row.length >= 16)
    .map((row) => {
      const [
        symbol,
        name,
        _mPrev,
        marginBuy,
        marginSell,
        _mCash,
        marginBalance,
        marginLimit,
        _sPrev,
        shortSell,
        shortBuy,
        _sCash,
        shortBalance,
        shortLimit,
        offsetting,
        note,
      ] = row;

      return {
        date: formatDate(raw.date),
        symbol: symbol?.trim() ?? "",
        name: name?.trim() ?? "",
        marginPurchase: parseNumber(marginBuy),
        marginRepayment: parseNumber(marginSell),
        marginBalance: parseNumber(marginBalance),
        marginLimit: parseNumber(marginLimit),
        shortSale: parseNumber(shortSell),
        shortRepayment: parseNumber(shortBuy),
        shortBalance: parseNumber(shortBalance),
        shortLimit: parseNumber(shortLimit),
        offsetting: parseNumber(offsetting),
        note: note?.trim() ?? "",
      };
    });
}

// 解析個股歷史資料（STOCK_DAY）
export function parseHistoricalData(raw: TwseApiResponse): HistoricalData[] {
  if (!raw.data || raw.data.length === 0) {
    return [];
  }

  return raw.data.map((row) => {
    const [date, volume, value, open, high, low, close, change, transactions] =
      row;

    const closeNum = parseNumber(close);
    const changeNum = parseChange(change);
    const prev = closeNum - changeNum;
    const changePercent = prev !== 0 ? (changeNum / prev) * 100 : 0;

    return {
      date: formatDate(date),
      openPrice: parseNumber(open),
      highPrice: parseNumber(high),
      lowPrice: parseNumber(low),
      closePrice: closeNum,
      change: changeNum,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: parseNumber(volume),
      value: parseNumber(value),
      transactions: parseNumber(transactions),
    };
  });
}

// 民國年轉西元年（如 113/01/02 → 2024-01-02）
function formatDate(raw: string): string {
  if (!raw) return "";
  // 若已是 YYYYMMDD 格式
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  // 民國年 YYY/MM/DD
  const match = raw.match(/^(\d+)\/(\d+)\/(\d+)$/);
  if (match) {
    const year = parseInt(match[1]) + 1911;
    return `${year}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  }
  return raw;
}
