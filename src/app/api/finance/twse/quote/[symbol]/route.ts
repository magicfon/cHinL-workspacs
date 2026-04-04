import { NextRequest } from "next/server";
import { fetchStockQuote } from "@/lib/scraper/twseClient";
import { parseStockQuote } from "@/lib/scraper/parsers";
import {
  successResponse,
  errorResponse,
  validateSymbol,
} from "@/lib/scraper/errorHandler";

/**
 * GET /api/twse/quote/[symbol]
 * 取得個股即時（當日最新）行情
 *
 * @param symbol - 股票代號（如 2330）
 *
 * 回應範例：
 * {
 *   success: true,
 *   data: {
 *     symbol: "2330",
 *     name: "台積電",
 *     date: "2024-01-15",
 *     closePrice: 600.0,
 *     change: +5.0,
 *     changePercent: 0.84,
 *     volume: 25000000,
 *     ...
 *   },
 *   timestamp: "2024-01-15T09:30:00.000Z"
 * }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    validateSymbol(symbol);

    const raw = await fetchStockQuote(symbol);
    const quote = parseStockQuote(symbol, raw);

    return successResponse(quote);
  } catch (error) {
    return errorResponse(error);
  }
}
