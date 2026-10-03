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

## 新貼文通知（選用，由 Hermes 自己發）

每次收集完貼文、寫好 inbox 之後，對「這次才第一次看到的原創貼文」（`is_repost` 為 false，
`id` 不在你上次已通知過的清單裡；已通知的 id 請自行記在 Hermes 本機，不要寫進程式庫）
用你已設定的通訊管道（例如 Telegram、LINE、Discord，用 cHin 平常收訊息的那個）各發一則簡短通知。
沒有新貼文就不要發。內容用繁體中文，格式：

```
Serenity 新貼文 · YYYY-MM-DD
代號：$AAOI（偏多）、$LITE（中性）
摘要：1–2 句，80 字內，忠實轉述，不加貼文沒有的內容。
風險：貼文提到的風險，30 字內；沒有就省略這行。
原文：https://x.com/aleabitoreddit/status/<id>
```

- 立場只有三種：偏多（看好、持有、指出利多）、偏空（看壞、警告、賣出）、中性（單純提及、轉述新聞、看法不明）。拿不準就標中性。
- 一則貼文提到多個代號，就在「代號」那行全部列出，各自標立場。沒有 `$代號` 的貼文不通知。
- 這只是通知，不寫入程式庫，也不影響網站；網站的立場標註仍由每天 08:47 的更新負責，兩邊偶爾判斷不同是正常的。
- 這不是投資建議，通知裡不要加買賣建議。
