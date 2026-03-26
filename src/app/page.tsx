"use client";

import {
  TrendingUp,
  BarChart2,
  Users,
  ClipboardList,
  Activity,
  Clock,
  Zap,
  ExternalLink,
  Server,
  Shield,
  Globe,
  ChevronRight,
  Terminal,
} from "lucide-react";

const BUILD_DATE = "2026-03-26";
const DEPLOY_DATE = "Mar 26, 2026";

function getUptime() {
  const start = new Date("2025-01-01");
  const now = new Date(BUILD_DATE);
  const diffMs = now.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

const { days: uptimeDays, hours: uptimeHours } = getUptime();

interface Project {
  id: number;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  link: string;
  accentColor: string;
  bgGradient: string;
  status: "live" | "beta" | "dev";
}

const projects: Project[] = [
  {
    id: 1,
    icon: TrendingUp,
    title: "Financial Analysis",
    subtitle: "Platform",
    description: "NASDAQ 100 期貨三大法人交易資料視覺化",
    tags: ["Next.js", "Supabase", "Recharts"],
    link: "#",
    accentColor: "rgba(52, 211, 153, 0.85)",
    bgGradient: "from-emerald-500/8 to-transparent",
    status: "dev",
  },
  {
    id: 2,
    icon: BarChart2,
    title: "System Usage",
    subtitle: "Dashboard",
    description: "AI Agent 使用量監控與分析",
    tags: ["React", "Vercel"],
    link: "https://usage-dashboard-pi.vercel.app",
    accentColor: "rgba(96, 165, 250, 0.85)",
    bgGradient: "from-blue-500/8 to-transparent",
    status: "live",
  },
  {
    id: 3,
    icon: Users,
    title: "Congregation",
    subtitle: "Management System",
    description: "教會會眾資料管理與統計分析",
    tags: ["Next.js", "Supabase", "NextAuth"],
    link: "https://congregation-management-system.vercel.app",
    accentColor: "rgba(167, 139, 250, 0.85)",
    bgGradient: "from-violet-500/8 to-transparent",
    status: "live",
  },
  {
    id: 4,
    icon: ClipboardList,
    title: "Mission",
    subtitle: "Control",
    description: "AI Agent 任務協調與進度追蹤",
    tags: ["Node.js", "SQLite", "WebSocket"],
    link: "https://chinlmc.zeabur.app",
    accentColor: "rgba(251, 146, 60, 0.85)",
    bgGradient: "from-orange-500/8 to-transparent",
    status: "live",
  },
];

const statusItems = [
  { label: "API Status", value: "Online", icon: Server, color: "text-emerald-400" },
  { label: "Uptime", value: `${uptimeDays}d ${uptimeHours}h`, icon: Clock, color: "text-blue-400" },
  { label: "Last Deploy", value: DEPLOY_DATE, icon: Zap, color: "text-violet-400" },
  { label: "Security", value: "Protected", icon: Shield, color: "text-emerald-400" },
  { label: "Region", value: "Global CDN", icon: Globe, color: "text-blue-400" },
];

const tickerItems = [
  { label: "NASDAQ-100", value: "+1.24%", positive: true },
  { label: "AI Requests", value: "12,847", positive: true },
  { label: "System Load", value: "23%", positive: true },
  { label: "API Latency", value: "42ms", positive: true },
  { label: "Uptime", value: "99.9%", positive: true },
  { label: "Data Points", value: "2.4M", positive: true },
  { label: "Active Users", value: "Online", positive: true },
  { label: "Build Status", value: "Passing", positive: true },
];

function StatusBadge({ status }: { status: Project["status"] }) {
  const config = {
    live: { label: "LIVE", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    beta: { label: "BETA", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    dev: { label: "DEV", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  }[status];

  return (
    <span
      className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border ${config.cls}`}
    >
      {config.label}
    </span>
  );
}

function ProjectCard({ project, delay }: { project: Project; delay: string }) {
  const Icon = project.icon;
  const isPlaceholder = project.link === "#";

  return (
    <a
      href={project.link}
      target={isPlaceholder ? undefined : "_blank"}
      rel={isPlaceholder ? undefined : "noopener noreferrer"}
      onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
      className={`group block rounded-xl p-5 card-hover animate-fade-in-up ${delay} bg-gradient-to-br ${project.bgGradient} cursor-pointer`}
      style={{
        background: `linear-gradient(135deg, ${project.bgGradient.replace("from-", "").replace("/8", "").replace(" to-transparent", "")} 0%, transparent 100%)`,
        backgroundColor: "hsl(222, 47%, 7%)",
        border: "1px solid hsl(217, 33%, 14%)",
      }}
      aria-label={`${project.title} ${project.subtitle} — ${project.description}`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `${project.accentColor.replace("0.85", "0.12")}`,
            border: `1px solid ${project.accentColor.replace("0.85", "0.25")}`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: project.accentColor }} />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          <ExternalLink
            className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "hsl(215, 20%, 55%)" }}
          />
        </div>
      </div>

      {/* Title */}
      <div className="mb-2">
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: "hsl(215, 20%, 55%)" }}>
          {project.subtitle}
        </p>
        <h3 className="text-lg font-bold text-white leading-tight">{project.title}</h3>
      </div>

      {/* Description */}
      <p className="text-sm mb-4 leading-relaxed" style={{ color: "hsl(215, 20%, 62%)" }}>
        {project.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${project.accentColor.replace("0.85", "0.08")}`,
              border: `1px solid ${project.accentColor.replace("0.85", "0.2")}`,
              color: project.accentColor,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bottom arrow */}
      <div className="flex items-center justify-end mt-4 gap-1">
        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: project.accentColor }}>
          Open project
        </span>
        <ChevronRight
          className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-all group-hover:translate-x-0.5"
          style={{ color: project.accentColor }}
        />
      </div>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <div className="scanline" />

      <div className="min-h-screen grid-bg text-foreground">
        {/* Ambient glow blobs */}
        <div
          className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* ── TICKER BAR ── */}
        <div
          className="border-b overflow-hidden py-1.5"
          style={{
            background: "hsl(222, 47%, 5.5%)",
            borderColor: "hsl(217, 33%, 12%)",
          }}
        >
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5 px-6 text-xs whitespace-nowrap">
                <span style={{ color: "hsl(215, 20%, 50%)" }}>{item.label}</span>
                <span className="font-mono font-semibold text-emerald-400">{item.value}</span>
                <span className="text-emerald-500 opacity-60">▲</span>
                <span className="text-emerald-500/20 ml-4">|</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── HEADER ── */}
        <header
          className="sticky top-0 z-50 border-b backdrop-blur-xl animate-fade-in"
          style={{
            background: "hsla(222, 47%, 4%, 0.85)",
            borderColor: "hsl(217, 33%, 12%)",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(96,165,250,0.1) 100%)",
                  border: "1px solid rgba(52,211,153,0.25)",
                }}
              >
                <Terminal className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-base tracking-tight">
                  <span className="text-emerald-400">cHinL</span>
                  <span className="text-white"> Workspace</span>
                </div>
                <div className="text-[10px] tracking-widest uppercase" style={{ color: "hsl(215, 20%, 50%)" }}>
                  AI-Powered Workspace
                </div>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2">
                <div className="status-dot" />
                <span className="text-xs font-medium text-emerald-400">System Online</span>
              </div>
              <div
                className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: "hsl(222, 47%, 7%)",
                  border: "1px solid hsl(217, 33%, 14%)",
                  color: "hsl(215, 20%, 55%)",
                }}
              >
                <Clock className="w-3 h-3" />
                <span>Updated {DEPLOY_DATE}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 pb-24">
          {/* ── HERO SECTION ── */}
          <section className="pt-20 pb-16">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 animate-fade-in-up"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.2)",
                }}
              >
                <div className="status-dot" style={{ width: 6, height: 6 }} />
                <span className="text-xs font-medium text-emerald-400 tracking-wider">All Systems Operational</span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 animate-fade-in-up delay-100">
                <span className="text-white">Welcome to </span>
                <span className="gradient-text">cHinL Workspace</span>
              </h1>

              {/* Subtitle */}
              <p
                className="text-xl md:text-2xl mb-10 animate-fade-in-up delay-200"
                style={{ color: "hsl(215, 20%, 58%)" }}
              >
                整合 AI 驅動的專業工具平台
              </p>

              {/* Stat cards */}
              <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up delay-300">
                {[
                  { value: "4", label: "Active Projects", icon: Activity, color: "text-emerald-400" },
                  { value: "Online", label: "System Status", icon: Zap, color: "text-blue-400" },
                  { value: `${uptimeDays}d`, label: "Uptime", icon: Clock, color: "text-violet-400" },
                ].map(({ value, label, icon: Icon, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl"
                    style={{
                      background: "hsl(222, 47%, 7%)",
                      border: "1px solid hsl(217, 33%, 14%)",
                    }}
                  >
                    <Icon className={`w-4 h-4 ${color}`} />
                    <div className="text-left">
                      <div className={`text-lg font-bold ${color}`}>{value}</div>
                      <div className="text-[11px]" style={{ color: "hsl(215, 20%, 50%)" }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PROJECTS SECTION ── */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div
                  className="text-[11px] font-semibold tracking-widest uppercase mb-1"
                  style={{ color: "hsl(215, 20%, 50%)" }}
                >
                  Portfolio
                </div>
                <h2 className="text-2xl font-bold text-white">Projects</h2>
              </div>
              <div
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: "hsl(222, 47%, 7%)",
                  border: "1px solid hsl(217, 33%, 14%)",
                  color: "hsl(215, 20%, 55%)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                4 / 4 Online
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {projects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  delay={`delay-${(i + 1) * 100}` as string}
                />
              ))}
            </div>
          </section>

          {/* ── SYSTEM STATUS SECTION ── */}
          <section className="mb-16 animate-fade-in-up delay-600">
            <div className="mb-6">
              <div
                className="text-[11px] font-semibold tracking-widest uppercase mb-1"
                style={{ color: "hsl(215, 20%, 50%)" }}
              >
                Infrastructure
              </div>
              <h2 className="text-2xl font-bold text-white">System Status</h2>
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                background: "hsl(222, 47%, 7%)",
                border: "1px solid hsl(217, 33%, 14%)",
              }}
            >
              {/* Overall status bar */}
              <div
                className="flex items-center gap-3 pb-5 mb-5"
                style={{ borderBottom: "1px solid hsl(217, 33%, 12%)" }}
              >
                <div
                  className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg"
                  style={{
                    background: "rgba(52,211,153,0.06)",
                    border: "1px solid rgba(52,211,153,0.18)",
                  }}
                >
                  <div className="status-dot" />
                  <span className="text-sm font-semibold text-emerald-400">All Systems Operational</span>
                </div>
                <span className="text-xs" style={{ color: "hsl(215, 20%, 50%)" }}>
                  Last checked just now
                </span>
              </div>

              {/* Status items grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statusItems.map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="text-center">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                      style={{
                        background: "hsl(222, 47%, 9%)",
                        border: "1px solid hsl(217, 33%, 16%)",
                      }}
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className={`text-sm font-bold ${color}`}>{value}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "hsl(215, 20%, 48%)" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bars */}
              <div
                className="mt-5 pt-5 grid grid-cols-1 md:grid-cols-3 gap-4"
                style={{ borderTop: "1px solid hsl(217, 33%, 12%)" }}
              >
                {[
                  { label: "API Response Time", value: 42, max: 200, unit: "ms", color: "#34d399" },
                  { label: "CPU Usage", value: 23, max: 100, unit: "%", color: "#60a5fa" },
                  { label: "Memory Usage", value: 38, max: 100, unit: "%", color: "#a78bfa" },
                ].map(({ label, value, max, unit, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: "hsl(215, 20%, 55%)" }}>{label}</span>
                      <span className="text-xs font-mono font-semibold" style={{ color }}>
                        {value}{unit}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "hsl(217, 33%, 12%)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${(value / max) * 100}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}88)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer
          className="border-t"
          style={{
            background: "hsl(222, 47%, 5%)",
            borderColor: "hsl(217, 33%, 12%)",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left: branding */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">
                    <span className="text-emerald-400">cHinL</span>
                    <span className="text-white"> Workspace</span>
                  </span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: "hsl(222, 47%, 10%)",
                      border: "1px solid hsl(217, 33%, 16%)",
                      color: "hsl(215, 20%, 55%)",
                    }}
                  >
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs" style={{ color: "hsl(215, 20%, 45%)" }}>
                  Built with Next.js · Tailwind CSS · TypeScript
                </p>
              </div>

              {/* Center: tech pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {["Next.js 14", "React 18", "TypeScript", "Tailwind CSS", "Lucide"].map((tech) => (
                  <span
                    key={tech}
                    className="text-[11px] px-2.5 py-1 rounded-md font-medium"
                    style={{
                      background: "hsl(222, 47%, 8%)",
                      border: "1px solid hsl(217, 33%, 14%)",
                      color: "hsl(215, 20%, 55%)",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Right: meta */}
              <div className="text-right">
                <p className="text-xs font-mono" style={{ color: "hsl(215, 20%, 45%)" }}>
                  Deploy: {DEPLOY_DATE}
                </p>
                <p className="text-xs" style={{ color: "hsl(215, 20%, 35%)" }}>
                  © 2026 cHinL Workspace
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
