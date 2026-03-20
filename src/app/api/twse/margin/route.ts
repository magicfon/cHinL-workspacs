import { NextRequest } from "next/server";
import { fetchMarginTrading } from "@/lib/scraper/twseClient";
import { parseMarginTrading } from "@/lib/scraper/parsers";
import {
  successResponse,
  errorResponse,
  ValidationError,
} from "@/lib/scraper/errorHandler";

/**
 * GET /api/twse/margin
 * 取得融資融券餘額資料
 *
 * 查詢參數：
 * - symbol: 股票代號（選填，不填則回傳全部）
 * - limit: 回傳筆數上限（預設 50，最大 500）
 * - sort: 排序欄位（marginBalance | shortBalance | offsetting，預設 marginBalance）
 * - order: 排序方向（desc | asc，預設 desc）
 *
 * 回應範例：
 * {
 *   success: true,
 *   data: {
 *     date: "2024-01-15",
 *     total: 100,
 *     records: [
 *       {
 *         symbol: "2330",
 *         name: "台積電",
 *         marginBalance: 1000000,
 *         shortBalance: 50000,
 *         ...
 *       }
 *     ]
 *   },
 *   timestamp: "..."
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 500);
    const sort = searchParams.get("sort") ?? "marginBalance";
    const order = searchParams.get("order") ?? "desc";

    const validSortFields = ["marginBalance", "shortBalance", "offsetting"];
    const sortField = validSortFields.includes(sort) ? sort : "marginBalance";

    // 驗證 symbol 格式（如有填寫）
    if (symbol && !/^\d{4,6}$/.test(symbol)) {
      throw new ValidationError(`無效的股票代號格式: ${symbol}`);
    }

    const raw = await fetchMarginTrading();
    let data = parseMarginTrading(raw);

    // 依股票代號篩選
    if (symbol) {
      data = data.filter((d) => d.symbol === symbol);
      if (data.length === 0) {
        throw new Error(`查無股票代號 ${symbol} 的融資融券資料`);
      }
      return successResponse(data[0]);
    }

    // 排序
    data.sort((a, b) => {
      const av = a[sortField as keyof typeof a] as number;
      const bv = b[sortField as keyof typeof b] as number;
      return order === "asc" ? av - bv : bv - av;
    });

    // 限制筆數
    data = data.slice(0, limit);

    return successResponse({
      date: data[0]?.date ?? "",
      total: data.length,
      records: data,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
