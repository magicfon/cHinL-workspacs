# /alpha 每日更新流程

追蹤名單：`accounts.json`（可增減；`source: "serenity"` 的帳號直接沿用 /serenity 已判讀的貼文）。
其他帳號的貼文由 Hermes 每天寫進 `inbox/`（見 HERMES.md）。這個環境連不到 x.com。

1. `python3 scripts/alpha/fetch_new.py` → 產生 `new_tweets.json`。顯示 0 則就到第 4 步。
2. 逐則判讀 `new_tweets.json`，寫 `scripts/alpha/new_labels.json`：
   `[{"id": "...", "s": {"TICKER": "bull|bear|neutral"}, "zh": "...", "risk": "..."}]`
   - 每則貼文的每個代號都要有立場。bull＝作者看好／持有／買進／指出利多；bear＝看壞／放空／賣出／警告；
     neutral＝單純提及、轉述新聞、列清單、看法混合或不明。保守判斷。
   - 交易員常用術語：long/bought/added/breakout/setup＝bull；short/puts/sold/stopped out/broke down＝bear；
     watchlist 只列名單＝neutral。
   - `zh`：忠實的繁體中文摘要，1–2 句、80 字內，不加貼文沒有的內容；稱呼作者用其名字（accounts.json 的 name）。
   - `risk`：貼文提到的風險，30 字內繁中短語；沒有就空字串。
3. `python3 scripts/alpha/merge_labels.py`
4. `python3 scripts/alpha/build.py`（Serenity 的新判讀也會一起帶進來，所以要在 /serenity 更新之後跑）
5. 刪掉 `new_tweets.json`、`new_labels.json`。若 `public/alpha/index.html` 或 `posts.json` 有變更，
   commit 到 main 並 push（Vercel 會自動部署）。沒有變更就不要 commit。
