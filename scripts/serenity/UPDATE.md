# /serenity 每日更新流程

資料來源：@aleabitoreddit 的公開貼文存檔
https://github.com/yan-labs/serenity-aleabitoreddit （data/aleabitoreddit_tweets.csv）。
這個環境連不到 x.com，所以只能等存檔更新；存檔沒有新貼文時，頁面不變。

1. `python3 scripts/serenity/fetch_new.py`（讀公開存檔＋Hermes 每天寫入的 `inbox/`）→ 產生 `new_tweets.json`。顯示 0 則就到第 5 步。
2. 逐則判讀 `new_tweets.json`，寫 `scripts/serenity/new_labels.json`：
   `[{"id": "...", "s": {"TICKER": "bull|bear|neutral"}, "zh": "...", "risk": "..."}]`
   - 每則貼文的每個代號都要有立場。bull＝作者看好／持有／指出利多；bear＝看壞／警告／賣出；
     neutral＝單純提及、轉述新聞沒有看法、列在清單裡、看法混合或不明。保守判斷。
   - `zh`：忠實的繁體中文摘要，1–2 句、80 字內，不加貼文沒有的內容。
   - `risk`：貼文提到的風險，30 字內繁中短語；沒有就空字串。
   - 稱呼作者用「作者」或「Serenity」。
3. `python3 scripts/serenity/merge_labels.py`
4. 若新貼文提到 `analysis.json` 裡的前幾大代號，且論點有明顯變化（立場改變、新的催化劑或風險），
   更新該代號的 `summary`、`evolution`（最後一段延長或新增一段，`MM/DD–MM/DD`）、`risks`。
   只根據貼文內容，不加外部事實。
5. `python3 scripts/serenity/build.py && python3 scripts/serenity/export_picks.py`（後者更新 /stocks 的 Serenity 精選）
6. 刪掉 `new_tweets.json`、`new_labels.json`。若 `public/serenity/index.html`、`public/stocks/serenity.json` 或 `posts.json` 有變更，
   commit 到 main 並 push（Vercel 會自動部署）。沒有變更就不要 commit。
