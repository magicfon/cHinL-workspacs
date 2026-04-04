import { NextRequest } from "next/server";
import { fetchStockHistory } from "../../../../../../lib/scraper/twseClient";
import { parseHistoricalData } from "../../../../../../lib/scraper/parsers";
import {
  successResponse,
  errorResponse,
  validateSymbol,
  validateYearMonth,
} from "../../../../../../lib/scraper/errorHandler";

/**
 * GET /api/twse/history/[symbol]
 * 取得個股月歷史成交資料
 *
 * @param symbol - 股票代號（如 2330）
 *
 * 查詢參數：
 * - year: 年份（預設為當年，如 2024）
 * - month: 月份（預設為當月，如 1）
 *
 * 回應範例：
 * {
 *   success: true,
 *   data: {
 *     symbol: "2330",
 *     year: "2024",
 *     month: "1",
 *     records: [
 *       {
 *         date: "2024-01-02",
 *         openPrice: 590.0,
 *         highPrice: 605.0,
 *         lowPrice: 588.0,
 *         closePrice: 600.0,
 *         change: +10.0,
 *         changePercent: 1.69,
 *         volume: 25000000,
 *         value: 15000000000,
 *         transactions: 15000
 *       }
 *     ]
 *   },
 *   timestamp: "..."
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    validateSymbol(symbol);

    const now = new Date();
    const { searchParams } = req.nextUrl;
    const year = searchParams.get("year") ?? String(now.getFullYear());
    const month = searchParams.get("month") ?? String(now.getMonth() + 1);

    validateYearMonth(year, month);

    const raw = await fetchStockHistory(symbol, year, month);
    const records = parseHistoricalData(raw);

    if (records.length === 0) {
      throw new Error(`查無股票 ${symbol} 在 ${year}/${month} 的歷史資料`);
    }

    return successResponse({
      symbol,
      year,
      month,
      total: records.length,
      records,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
