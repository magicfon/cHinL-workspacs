// 個股即時行情
export interface StockQuote {
  symbol: string;
  name: string;
  date: string;
  time: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  change: number;
  changePercent: number;
  volume: number;
  value: number;
  transactions: number;
  yesterdayClose: number;
  buyPrice: number;
  sellPrice: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

// 三大法人買賣超
export interface InstitutionalInvestors {
  date: string;
  symbol?: string;
  name?: string;
  foreignBuy: number;
  foreignSell: number;
  foreignNet: number;
  investmentTrustBuy: number;
  investmentTrustSell: number;
  investmentTrustNet: number;
  dealerBuy: number;
  dealerSell: number;
  dealerNet: number;
  totalNet: number;
}

// 融資融券
export interface MarginTrading {
  date: string;
  symbol: string;
  name: string;
  marginPurchase: number;
  marginRepayment: number;
  marginBalance: number;
  marginLimit: number;
  shortSale: number;
  shortRepayment: number;
  shortBalance: number;
  shortLimit: number;
  offsetting: number;
  note: string;
}

// 歷史資料
export interface HistoricalData {
  date: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  change: number;
  changePercent: number;
  volume: number;
  value: number;
  transactions: number;
}

// API 回應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// TWSE 原始 API 回應格式
export interface TwseApiResponse {
  stat: string;
  date: string;
  title: string;
  fields: string[];
  data: string[][];
  notes?: string[];
  total?: number;
}

// 查詢參數
export interface QuoteQueryParams {
  symbol: string;
}

export interface HistoryQueryParams {
  symbol: string;
  year?: string;
  month?: string;
}
