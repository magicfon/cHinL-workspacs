# 給 Hermes agent：每日收集 Alpha Consensus 追蹤帳號的貼文

追蹤名單在 `scripts/alpha/accounts.json`。Serenity（@aleabitoreddit）已由 `scripts/serenity/HERMES.md` 的流程收集，這裡**不用**再抓。

美股交易日（週一到週五）執行兩次，時間以美東時間為準：
- **開盤前**：美東 08:15（台北夏令 20:15、冬令 21:15）
- **收盤後**：美東 16:15（台北夏令 04:15、冬令 05:15）

網站會在美東 08:47 和 16:47 讀取並更新，所以請在這之前 push。

0. 先在本機的 chinl-workspacs 程式庫 `git pull origin main`，重新讀這份 HERMES.md 和 accounts.json，帳號名單可能有更新。
1. 用瀏覽器（已登入 X 的設定檔）依序打開 accounts.json 裡其他每個帳號的頁面
   （`https://x.com/<handle>`），往下捲動，收集最近 3 天內的貼文，包含長文（點「顯示更多」取得完整內容）。
   第一次執行請改收最近 30 天，讓網站有足夠資料比對共識。
   2026-10-04 新增 @zephyr_z9（Zephyr）和 @unusual_whales（Unusual Whales）：下一次執行時這兩個帳號也請收最近 30 天。
2. 在本機的 chinl-workspacs 程式庫 `git pull origin main`，把所有帳號的結果寫進同一個檔案
   `scripts/alpha/inbox/YYYY-MM-DD-open.json`（開盤前）或 `YYYY-MM-DD-close.json`（收盤後），日期用美東當天日期。格式是 JSON 陣列：

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
3. `git add scripts/alpha/inbox && git commit -m "Alpha inbox YYYY-MM-DD open|close" && git push origin main`
   只動 `scripts/alpha/inbox/`，不要改其他檔案。

網站端（Claude）每個交易日美東 08:47 和 16:47 會讀 inbox，判讀立場、更新 /alpha 並部署。
