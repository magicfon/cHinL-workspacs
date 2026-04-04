import { NextResponse } from "next/server";
import { ApiResponse } from "../../types/twse";

export class TwseError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "TwseError";
  }
}

export class NotFoundError extends TwseError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends TwseError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  const body: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof TwseError) {
    const body: ApiResponse<never> = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(body, { status: error.statusCode });
  }

  const message =
    error instanceof Error ? error.message : "伺服器發生未知錯誤";

  // 根據錯誤訊息判斷狀態碼
  let status = 500;
  if (message.includes("查無") || message.includes("無資料")) {
    status = 404;
  } else if (message.includes("格式") || message.includes("參數")) {
    status = 400;
  }

  const body: ApiResponse<never> = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

// 驗證股票代號格式（4-6 位數字，台股一般為 4 碼）
export function validateSymbol(symbol: string): void {
  if (!symbol) {
    throw new ValidationError("請提供股票代號");
  }
  if (!/^\d{4,6}$/.test(symbol)) {
    throw new ValidationError(
      `無效的股票代號格式: ${symbol}，應為 4-6 位數字`
    );
  }
}

// 驗證年月參數
export function validateYearMonth(year: string, month: string): void {
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
    throw new ValidationError(`無效的年份: ${year}`);
  }
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new ValidationError(`無效的月份: ${month}`);
  }
}
