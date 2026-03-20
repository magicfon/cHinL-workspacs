import SearchBar from "@/components/SearchBar";
import StockQuoteCard from "@/components/StockQuoteCard";
import { StockQuote } from "@/types/twse";

interface PageProps {
  searchParams: { symbol?: string };
}

async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/twse/quote/${symbol}`, {
      next: { revalidate: 60 },
    });
    const json = await res.json();
    if (json.success) return json.data as StockQuote;
    return null;
  } catch {
    return null;
  }
}

export default async function HomePage({ searchParams }: PageProps) {
  const symbol = searchParams.symbol?.trim();
  let quote: StockQuote | null = null;
  let error: string | null = null;

  if (symbol) {
    if (!/^\d{4,6}$/.test(symbol)) {
      error = `無效的股票代號: ${symbol}`;
    } else {
      quote = await fetchQuote(symbol);
      if (!quote) error = `查無股票 ${symbol} 的資料，請確認代號是否正確`;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
            台股財經分析平台
          </h1>
          <div className="flex-1">
            <SearchBar defaultValue={symbol ?? ""} />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!symbol && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              台灣股市行情查詢
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              輸入股票代號以查看個股行情、三大法人動向與融資融券資料
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["2330", "2317", "2454", "2412", "2882"].map((s) => (
                <a
                  key={s}
                  href={`/?symbol=${s}`}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {quote && (
          <div className="space-y-6">
            <StockQuoteCard quote={quote} />

            {/* API 端點說明 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                可用 API 端點
              </h3>
              <div className="space-y-2 font-mono text-sm">
                <ApiEndpoint
                  method="GET"
                  path={`/api/twse/quote/${symbol}`}
                  desc="個股即時行情"
                />
                <ApiEndpoint
                  method="GET"
                  path="/api/twse/institutional"
                  desc="三大法人買賣超"
                />
                <ApiEndpoint
                  method="GET"
                  path={`/api/twse/margin?symbol=${symbol}`}
                  desc="融資融券餘額"
                />
                <ApiEndpoint
                  method="GET"
                  path={`/api/twse/history/${symbol}`}
                  desc="月歷史成交資料"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ApiEndpoint({
  method,
  path,
  desc,
}: {
  method: string;
  path: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-bold">
        {method}
      </span>
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline flex-1"
      >
        {path}
      </a>
      <span className="text-gray-500 dark:text-gray-400 text-xs">{desc}</span>
    </div>
  );
}
