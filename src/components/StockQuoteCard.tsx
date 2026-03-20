"use client";

import { StockQuote } from "@/types/twse";

interface Props {
  quote: StockQuote;
}

export default function StockQuoteCard({ quote }: Props) {
  const isPositive = quote.change > 0;
  const isNegative = quote.change < 0;
  const colorClass = isPositive
    ? "text-red-500"
    : isNegative
      ? "text-green-500"
      : "text-gray-700 dark:text-gray-300";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {quote.name}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {quote.symbol} · {quote.date}
          </span>
        </div>
        <div className={`text-right ${colorClass}`}>
          <div className="text-3xl font-bold">
            {quote.closePrice.toFixed(2)}
          </div>
          <div className="text-sm font-medium">
            {isPositive ? "▲" : isNegative ? "▼" : "—"}{" "}
            {Math.abs(quote.change).toFixed(2)} (
            {Math.abs(quote.changePercent).toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Stat label="開盤" value={quote.openPrice.toFixed(2)} />
        <Stat label="昨收" value={quote.yesterdayClose.toFixed(2)} />
        <Stat label="最高" value={quote.highPrice.toFixed(2)} color="text-red-500" />
        <Stat label="最低" value={quote.lowPrice.toFixed(2)} color="text-green-500" />
        <Stat label="成交量" value={formatVolume(quote.volume)} />
        <Stat label="成交筆數" value={quote.transactions.toLocaleString()} />
        <Stat label="成交金額" value={formatValue(quote.value)} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-sm font-semibold ${color ?? "text-gray-800 dark:text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function formatVolume(v: number): string {
  if (v >= 1e8) return (v / 1e8).toFixed(1) + " 億股";
  if (v >= 1e4) return (v / 1e4).toFixed(1) + " 萬股";
  return v.toLocaleString() + " 股";
}

function formatValue(v: number): string {
  if (v >= 1e8) return (v / 1e8).toFixed(2) + " 億";
  if (v >= 1e4) return (v / 1e4).toFixed(2) + " 萬";
  return v.toLocaleString();
}
