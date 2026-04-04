"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  defaultValue?: string;
  onSearch?: (symbol: string) => void;
}

export default function SearchBar({ defaultValue = "", onSearch }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const symbol = value.trim();
    if (/^\d{4,6}$/.test(symbol)) {
      if (onSearch) {
        onSearch(symbol);
      } else {
        router.push(`/?symbol=${symbol}`);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "hsl(215, 20%, 40%)" }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="輸入股票代號（如 2330）"
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          style={{
            background: "hsl(222, 47%, 9%)",
            border: "1px solid hsl(217, 33%, 14%)",
            color: "hsl(210, 40%, 98%)",
          }}
          maxLength={6}
        />
      </div>
      <button
        type="submit"
        className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: "linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(52,211,153,0.15) 100%)",
          border: "1px solid rgba(52,211,153,0.3)",
          color: "rgb(52,211,153)",
        }}
      >
        查詢
      </button>
    </form>
  );
}
