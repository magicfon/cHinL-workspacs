"use client";

import { useState } from "react";
import SearchBar from "../../../components/SearchBar";
import StockQuoteCard from "../../../components/StockQuoteCard";
import { StockQuote } from "../../../types/twse";
import {
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  Zap,
} from "lucide-react";

const QUICK_SYMBOLS = ["2330", "2317", "2454", "2412", "2882", "2308", "2891", "6505"];

const API_ENDPOINTS = [
  { method: "GET", path: "/api/finance/twse/quote/:symbol", desc: "個股即時行情" },
  { method: "GET", path: "/api/finance/twse/institutional", desc: "三大法人買賣超" },
  { method: "GET", path: "/api/finance/twse/margin?symbol=:symbol", desc: "融資融券餘額" },
  { method: "GET", path: "/api/finance/twse/history/:symbol", desc: "月歷史成交資料" },
];

async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
    const res = await fetch(`${baseUrl}/api/finance/twse/quote/${symbol}`, {
      next: { revalidate: 60 },
    });
    const json = await res.json();
    if (json.success) return json.data as StockQuote;
    return null;
  } catch {
    return null;
  }
}

export default function FinancePage() {
  const [symbol, setSymbol] = useState<string>("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (s: string) => {
    setSymbol(s);
    setError(null);
    setQuote(null);

    if (!s.trim()) return;

    const trimmed = s.trim();
    if (!/^\d{4,6}$/.test(trimmed)) {
      setError(`無效的股票代號: ${trimmed}`);
      return;
    }

    setLoading(true);
    const data = await fetchQuote(trimmed);
    setLoading(false);

    if (!data) setError(`查無股票 ${trimmed} 的資料，請確認代號是否正確`);
    else setQuote(data);
  };

  const handleQuickSymbol = (s: string) => {
    handleSearch(s);
  };

  return (
    <>
      <div className="scanline" />
      <div className="min-h-screen grid-bg text-foreground">
        {/* Header */}
        <header
          className="sticky top-0 z-50 border-b backdrop-blur-xl animate-fade-in"
          style={{
            background: "hsla(222, 47%, 4%, 0.85)",
            borderColor: "hsl(217, 33%, 12%)",
          }}
        >
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
            <a
              href="/finance"
              className="flex items-center gap-2 text-sm hover:text-emerald-400 transition-colors shrink-0"
              style={{ color: "hsl(215, 20%, 55%)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Finance</span>
            </a>
            <div
              className="w-px h-6 shrink-0"
              style={{ background: "hsl(217, 33%, 14%)" }}
            />
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(96,165,250,0.1) 100%)",
                  border: "1px solid rgba(52,211,153,0.25)",
                }}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h1 className="text-lg font-bold text-white whitespace-nowrap">
                台股財經分析
              </h1>
            </div>
            <div className="flex-1 max-w-md">
              <SearchBar defaultValue={symbol} onSearch={handleSearch} />
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {/* Empty state */}
          {!symbol && !error && (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="text-6xl mb-6">📈</div>
              <h2 className="text-3xl font-bold text-white mb-3">
                台灣股市行情查詢
              </h2>
              <p className="text-lg mb-8" style={{ color: "hsl(215, 20%, 58%)" }}>
                輸入股票代號以查看個股行情、三大法人動向與融資融券資料
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleQuickSymbol(s)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{
                      background: "rgba(52,211,153,0.08)",
                      border: "1px solid rgba(52,211,153,0.2)",
                      color: "rgb(52,211,153)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-10 h-10 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mb-4" />
              <p className="text-sm" style={{ color: "hsl(215, 20%, 55%)" }}>
                查詢中...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              className="rounded-xl p-4 mb-6 animate-fade-in-up"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "rgb(248,113,113)",
              }}
            >
              {error}
            </div>
          )}

          {/* Quote result */}
          {quote && !loading && (
            <div className="space-y-6 animate-fade-in-up">
              <StockQuoteCard quote={quote} />

              {/* API Endpoints */}
              <div
                className="rounded-xl p-6"
                style={{
                  background: "hsl(222, 47%, 7%)",
                  border: "1px solid hsl(217, 33%, 14%)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">
                    可用 API 端點
                  </h3>
                </div>
                <div className="space-y-1">
                  {API_ENDPOINTS.map(({ method, path, desc }) => {
                    const resolvedPath = path.replace(
                      ":symbol",
                      symbol
                    );
                    return (
                      <div
                        key={path}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg"
                        style={{ borderBottom: "1px solid hsl(217, 33%, 10%)" }}
                      >
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{
                            background: "rgba(52,211,153,0.12)",
                            color: "rgb(52,211,153)",
                          }}
                        >
                          {method}
                        </span>
                        <a
                          href={resolvedPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-blue-400 hover:underline flex-1"
                        >
                          {resolvedPath}
                        </a>
                        <span
                          className="text-xs hidden sm:inline"
                          style={{ color: "hsl(215, 20%, 50%)" }}
                        >
                          {desc}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
