# 給 Hermes agent：每日收集 Alpha Consensus 追蹤帳號的貼文

追蹤名單在 `scripts/alpha/accounts.json`。Serenity（@aleabitoreddit）已由 `scripts/serenity/HERMES.md` 的流程收集，這裡**不用**再抓。

每天執行一次（建議台北時間 09:00 前，在 09:17 的網站更新之前）：

1. 用瀏覽器（已登入 X 的設定檔）依序打開 accounts.json 裡其他每個帳號的頁面
   （`https://x.com/<handle>`），往下捲動，收集最近 3 天內的貼文，包含長文（點「顯示更多」取得完整內容）。
   第一次執行請改收最近 30 天，讓網站有足夠資料比對共識。
2. 在本機的 chinl-workspacs 程式庫 `git pull origin main`，把所有帳號的結果寫進同一個檔案
   `scripts/alpha/inbox/YYYY-MM-DD.json`（今天日期），格式是 JSON 陣列：

```json
[
  {
    "author": "jukan05",
    "id": "2100735673561174047",
    "date": "2026-10-03",
    "text": "貼文完整原文（原樣，不要翻譯或摘要）",
    "is_repost": false,
    "quoted_text": "若是引用別人的貼文，附被引用的原文；沒有就空字串",
    "likes": 374
  }
]
```

   - `author`：帳號 handle，不含 @，要跟 accounts.json 一致。
   - `id`：貼文網址 `https://x.com/<handle>/status/<id>` 裡的數字，用字串。
   - `date`：貼文日期（UTC），`YYYY-MM-DD`。
   - 轉推（repost）可以列，但 `is_repost` 設 true；網站只用原創貼文。回覆別人的貼文也算原創，要收。
   - 同一天重跑就覆寫當天的檔案。重複的貼文沒關係，網站端會去重。
   - 某個帳號打不開或沒有新貼文就略過，不要中斷其他帳號。
3. `git add scripts/alpha/inbox && git commit -m "Alpha inbox YYYY-MM-DD" && git push origin main`
   只動 `scripts/alpha/inbox/`，不要改其他檔案。

網站端（Claude）每天 09:17 會讀 inbox，判讀立場、更新 /alpha 並部署。
