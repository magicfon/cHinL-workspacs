"use client";

import {
  TrendingUp,
  ArrowLeft,
  Globe,
  DollarSign,
  Bitcoin,
  BarChart2,
  ArrowRight,
  Zap,
} from "lucide-react";

const markets = [
  {
    id: "twse",
    icon: TrendingUp,
    title: "台灣市場",
    subtitle: "TWSE / TPEX",
    description: "台股個股行情、三大法人動向、融資融券資料查詢",
    tags: ["台灣", "上市櫃", "法人"],
    link: "/finance/twse",
    accentColor: "rgba(52, 211, 153, 0.85)",
    status: "live" as const,
  },
  {
    id: "us",
    icon: DollarSign,
    title: "美國市場",
    subtitle: "NYSE / NASDAQ",
    description: "美股即時行情與市場數據",
    tags: ["美股", "S&P 500", "NASDAQ"],
    link: "#",
    accentColor: "rgba(96, 165, 250, 0.85)",
    status: "dev" as const,
  },
  {
    id: "crypto",
    icon: Bitcoin,
    title: "加密貨幣",
    subtitle: "Crypto",
    description: "主流加密貨幣即時價格與市場數據",
    tags: ["BTC", "ETH", "DeFi"],
    link: "#",
    accentColor: "rgba(251, 191, 36, 0.85)",
    status: "dev" as const,
  },
  {
    id: "global",
    icon: Globe,
    title: "全球匯率",
    subtitle: "Forex",
    description: "主要貨幣對匯率與走勢",
    tags: ["USD", "EUR", "JPY"],
    link: "#",
    accentColor: "rgba(167, 139, 250, 0.85)",
    status: "dev" as const,
  },
];

function StatusBadge({ status }: { status: "live" | "dev" }) {
  const config = {
    live: { label: "LIVE", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    dev: { label: "COMING SOON", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  }[status];

  return (
    <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border ${config.cls}`}>
      {config.label}
    </span>
  );
}

export default function FinancePage() {
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
              href="/"
              className="flex items-center gap-2 text-sm hover:text-emerald-400 transition-colors shrink-0"
              style={{ color: "hsl(215, 20%, 55%)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Workspace</span>
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
                <BarChart2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h1 className="text-lg font-bold text-white">財經分析</h1>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-12">
          {/* Hero */}
          <section className="text-center mb-12 animate-fade-in-up">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-3xl font-bold text-white mb-3">財經分析中心</h2>
            <p className="text-lg" style={{ color: "hsl(215, 20%, 58%)" }}>
              整合全球市場數據，一站式金融資訊平台
            </p>
          </section>

          {/* Market Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {markets.map((market, i) => {
              const Icon = market.icon;
              const isPlaceholder = market.link === "#";
              const isInternal = market.link.startsWith("/");

              return (
                <a
                  key={market.id}
                  href={market.link}
                  target={!isPlaceholder && !isInternal ? "_blank" : undefined}
                  rel={!isPlaceholder && !isInternal ? "noopener noreferrer" : undefined}
                  onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
                  className={`group block rounded-xl p-6 card-hover animate-fade-in-up delay-${(i + 1) * 100}`}
                  style={{
                    background: "hsl(222, 47%, 7%)",
                    border: "1px solid hsl(217, 33%, 14%)",
                    opacity: isPlaceholder ? 0.6 : 1,
                    cursor: isPlaceholder ? "default" : "pointer",
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: `${market.accentColor.replace("0.85", "0.12")}`,
                        border: `1px solid ${market.accentColor.replace("0.85", "0.25")}`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: market.accentColor }} />
                    </div>
                    <StatusBadge status={market.status} />
                  </div>

                  <div className="mb-2">
                    <p
                      className="text-[11px] font-semibold tracking-widest uppercase mb-0.5"
                      style={{ color: "hsl(215, 20%, 50%)" }}
                    >
                      {market.subtitle}
                    </p>
                    <h3 className="text-xl font-bold text-white">{market.title}</h3>
                  </div>

                  <p className="text-sm mb-4 leading-relaxed" style={{ color: "hsl(215, 20%, 62%)" }}>
                    {market.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {market.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: `${market.accentColor.replace("0.85", "0.08")}`,
                          border: `1px solid ${market.accentColor.replace("0.85", "0.2")}`,
                          color: market.accentColor,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {!isPlaceholder && (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs" style={{ color: market.accentColor }}>
                        進入市場
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: market.accentColor }} />
                    </div>
                  )}
                </a>
              );
            })}
          </div>

          {/* API Info */}
          <section className="mt-16 animate-fade-in-up delay-600">
            <div
              className="rounded-xl p-6"
              style={{
                background: "hsl(222, 47%, 7%)",
                border: "1px solid hsl(217, 33%, 14%)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">API 端點</h3>
              </div>
              <div className="space-y-2 font-mono text-sm">
                {[
                  { method: "GET", path: "/api/finance/twse/quote/:symbol", desc: "台股個股行情" },
                  { method: "GET", path: "/api/finance/twse/institutional", desc: "三大法人買賣超" },
                  { method: "GET", path: "/api/finance/twse/margin?symbol=:symbol", desc: "融資融券餘額" },
                  { method: "GET", path: "/api/finance/twse/history/:symbol", desc: "月歷史成交資料" },
                ].map(({ method, path, desc }) => (
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
                    <span className="text-blue-400 flex-1">{path}</span>
                    <span className="text-xs hidden sm:inline" style={{ color: "hsl(215, 20%, 50%)" }}>
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
