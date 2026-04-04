import { NextRequest } from "next/server";
import { fetchInstitutional } from "../../../../../lib/scraper/twseClient";
import { parseInstitutional } from "../../../../../lib/scraper/parsers";
import { successResponse, errorResponse } from "../../../../../lib/scraper/errorHandler";

/**
 * GET /api/twse/institutional
 * 取得三大法人（外資、投信、自營商）當日買賣超彙總
 *
 * 查詢參數：
 * - limit: 回傳筆數上限（預設 50，最大 500）
 * - sort: 排序欄位（totalNet | foreignNet | trustNet | dealerNet，預設 totalNet）
 * - order: 排序方向（desc | asc，預設 desc）
 *
 * 回應範例：
 * {
 *   success: true,
 *   data: [
 *     {
 *       date: "2024-01-15",
 *       symbol: "2330",
 *       name: "台積電",
 *       foreignNet: 5000,
 *       investmentTrustNet: 1000,
 *       dealerNet: -200,
 *       totalNet: 5800,
 *       ...
 *     }
 *   ],
 *   timestamp: "..."
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 500);
    const sort = searchParams.get("sort") ?? "totalNet";
    const order = searchParams.get("order") ?? "desc";

    const validSortFields = [
      "totalNet",
      "foreignNet",
      "investmentTrustNet",
      "dealerNet",
    ];
    const sortField = validSortFields.includes(sort) ? sort : "totalNet";

    const raw = await fetchInstitutional();
    let data = parseInstitutional(raw);

    // 排序
    data.sort((a, b) => {
      const av = a[sortField as keyof typeof a] as number;
      const bv = b[sortField as keyof typeof b] as number;
      return order === "asc" ? av - bv : bv - av;
    });

    // 限制筆數
    data = data.slice(0, limit);

    return successResponse({ date: raw.date, total: data.length, records: data });
  } catch (error) {
    return errorResponse(error);
  }
}
