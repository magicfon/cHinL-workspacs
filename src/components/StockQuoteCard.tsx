"use client";

import { StockQuote } from "../types/twse";

interface Props {
  quote: StockQuote;
}

export default function StockQuoteCard({ quote }: Props) {
  const isPositive = quote.change > 0;
  const isNegative = quote.change < 0;

  return (
    <div
      className="rounded-xl p-6 animate-fade-in-up"
      style={{
        background: "hsl(222, 47%, 7%)",
        border: "1px solid hsl(217, 33%, 14%)",
      }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{quote.name}</h2>
          <span className="text-sm" style={{ color: "hsl(215, 20%, 55%)" }}>
            {quote.symbol} · {quote.date}
          </span>
        </div>
        <div className="text-right">
          <div
            className="text-3xl font-bold font-mono"
            style={{
              color: isPositive
                ? "rgb(248, 113, 113)"
                : isNegative
                  ? "rgb(52, 211, 153)"
                  : "hsl(215, 20%, 65%)",
            }}
          >
            {quote.closePrice.toFixed(2)}
          </div>
          <div
            className="text-sm font-medium font-mono mt-1"
            style={{
              color: isPositive
                ? "rgb(248, 113, 113)"
                : isNegative
                  ? "rgb(52, 211, 153)"
                  : "hsl(215, 20%, 65%)",
            }}
          >
            {isPositive ? "▲" : isNegative ? "▼" : "—"}{" "}
            {Math.abs(quote.change).toFixed(2)} (
            {Math.abs(quote.changePercent).toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatItem label="開盤" value={quote.openPrice.toFixed(2)} />
        <StatItem label="昨收" value={quote.yesterdayClose.toFixed(2)} />
        <StatItem
          label="最高"
          value={quote.highPrice.toFixed(2)}
          color="rgb(248, 113, 113)"
        />
        <StatItem
          label="最低"
          value={quote.lowPrice.toFixed(2)}
          color="rgb(52, 211, 153)"
        />
        <StatItem label="成交量" value={formatVolume(quote.volume)} />
        <StatItem label="成交筆數" value={quote.transactions.toLocaleString()} />
        <StatItem label="成交金額" value={formatValue(quote.value)} />
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "hsl(222, 47%, 9%)",
        border: "1px solid hsl(217, 33%, 10%)",
      }}
    >
      <div className="text-xs mb-1" style={{ color: "hsl(215, 20%, 45%)" }}>
        {label}
      </div>
      <div
        className="text-sm font-semibold font-mono"
        style={{ color: color ?? "hsl(210, 40%, 98%)" }}
      >
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
