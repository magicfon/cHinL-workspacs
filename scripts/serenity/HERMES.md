# 給 Hermes agent：每日收集 @aleabitoreddit 貼文

每天執行一次（建議台北時間 08:00 前，在 08:47 的網站更新之前）：

1. 用瀏覽器（已登入 X 的設定檔）打開 https://x.com/aleabitoreddit ，往下捲動，
   收集最近 3 天內的貼文，包含長文（點「顯示更多」取得完整內容）。
2. 在本機的 chinl-workspacs 程式庫 `git pull origin main`，把結果寫成
   `scripts/serenity/inbox/YYYY-MM-DD.json`（今天日期），格式是 JSON 陣列：

```json
[
  {
    "id": "2100735673561174047",
    "date": "2026-09-17",
    "text": "貼文完整原文（英文原樣，不要翻譯或摘要）",
    "is_repost": false,
    "quoted_text": "若是引用別人的貼文，附被引用的原文；沒有就空字串",
    "likes": 374
  }
]
```

   - `id`：貼文網址 `https://x.com/aleabitoreddit/status/<id>` 裡的數字，用字串。
   - `date`：貼文日期（UTC），`YYYY-MM-DD`。
   - 轉推（repost）也可以列，但 `is_repost` 設 true；網站只用原創貼文。
   - 回覆別人的貼文也算原創，要收。
   - 同一天重跑就覆寫當天的檔案。重複的貼文沒關係，網站端會用 id 去重。
3. `git add scripts/serenity/inbox && git commit -m "Serenity inbox YYYY-MM-DD" && git push origin main`
   只動 `scripts/serenity/inbox/`，不要改其他檔案。

網站端（Claude）每天 08:47 會讀 inbox，判讀立場、更新頁面並部署。
