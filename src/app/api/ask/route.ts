import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM = `你是「Alpha Consensus 交易員共識」頁面的研究助理。使用者會問追蹤帳號對股票的看法，你只能根據提供的貼文資料回答。
規則：
- 用繁體中文，先給結論，再分帳號說明：目前立場、理由、近期是否改變看法（附日期）。
- 多個帳號時，比較共識與分歧，以及各自的理由依據有何不同。
- 資料沒提到的就說沒有資料，不要用你自己的知識補充，也不要給買賣建議。
- 引用時寫帳號名稱與日期，例如「Serenity（10/01）」。
- 控制在 250 字內，可用簡短條列。`;

/** POST /api/ask { question, context } → { answer }。context 由頁面整理好相關帳號與貼文。 */
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "網站尚未設定 ANTHROPIC_API_KEY，暫時無法使用 AI 問答。" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
  const context = typeof body?.context === "string" ? body.context.slice(0, 60000) : "";
  if (!question) return NextResponse.json({ error: "請輸入問題" }, { status: 400 });

  const client = new Anthropic();
  try {
    const msg = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: `<posts>\n${context || "（沒有相關貼文）"}\n</posts>\n\n問題：${question}` }],
    });
    if (msg.stop_reason === "refusal") return NextResponse.json({ error: "這個問題無法回答，請換個問法。" }, { status: 422 });
    const answer = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    return NextResponse.json({ answer });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "請求太頻繁，請稍後再試。" }, { status: 429 });
    if (e instanceof Anthropic.AuthenticationError) return NextResponse.json({ error: "ANTHROPIC_API_KEY 無效。" }, { status: 500 });
    if (e instanceof Anthropic.APIError) return NextResponse.json({ error: `AI 服務錯誤（${e.status}）` }, { status: 502 });
    return NextResponse.json({ error: "AI 服務連線失敗" }, { status: 502 });
  }
}
