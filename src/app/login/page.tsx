"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "LINE 登入失敗，請再試一次",
  OAuthCallback: "LINE 登入失敗，請再試一次",
  OAuthCreateAccount: "LINE 帳號建立失敗",
  AccessDenied: "此 LINE 帳號未獲授權，請聯絡管理員",
  Default: "登入發生錯誤，請再試一次",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const error = urlError ? ERROR_MESSAGES[urlError] ?? ERROR_MESSAGES.Default : "";

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  function handleLineLogin() {
    signIn("line", { callbackUrl });
  }

  return (
    <div className="min-h-screen grid-bg text-foreground flex items-center justify-center px-4">
      <div className="scanline" />

      <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(96,165,250,0.1) 100%)",
              border: "1px solid rgba(52,211,153,0.25)",
            }}
          >
            <svg
              className="w-8 h-8 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-emerald-400">cHinL</span> Workspace
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(215, 20%, 50%)" }}>
            使用 LINE 帳號登入
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "hsl(222, 47%, 7%)",
            border: "1px solid hsl(217, 33%, 14%)",
          }}
        >
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-lg text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "rgb(248,113,113)",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleLineLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "#06C755",
              color: "white",
              border: "none",
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            使用 LINE 登入
          </button>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "hsl(215, 20%, 35%)" }}
        >
          cHinL Workspace — AI-Powered Platform
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
