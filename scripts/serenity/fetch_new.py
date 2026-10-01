"""Download the public @aleabitoreddit archive and list posts not yet labeled.

Writes new_tweets.json: [{id,date,text,quoted,tickers,likes}] for original posts
with $TICKER mentions inside the 90-day window that are missing from posts.json.
"""
import csv, io, json, re, sys, urllib.request
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).parent
SRC = "https://raw.githubusercontent.com/yan-labs/serenity-aleabitoreddit/main/data/aleabitoreddit_tweets.csv"
csv.field_size_limit(10**9)

raw = urllib.request.urlopen(SRC, timeout=300).read().decode("utf-8")
rows = list(csv.DictReader(io.StringIO(raw)))
posts = json.loads((HERE / "posts.json").read_text())
known = {p["id"] for p in posts}
likes = {r["id"]: int(r["likes"] or 0) for r in rows}

latest = max(r["createdAtISO"][:10] for r in rows)
L = datetime.fromisoformat(latest)
new = []
for r in rows:
    if r["isRetweet"] != "False" or r["id"] in known:
        continue
    age = (L - datetime.fromisoformat(r["createdAtISO"][:10])).days
    if not 0 <= age < 90:
        continue
    tickers = sorted(set(re.findall(r"\$([A-Z]{1,6})\b", r["text"])))
    if tickers:
        new.append({"id": r["id"], "date": r["createdAtISO"][:10], "text": r["text"][:2500],
                    "quoted": (r["quoted_text"] or "")[:600], "tickers": tickers, "likes": likes[r["id"]]})

# refresh like counts on posts we already have
for p in posts:
    if p["id"] in likes:
        p["likes"] = likes[p["id"]]
(HERE / "posts.json").write_text(json.dumps(posts, ensure_ascii=False, indent=0))
new.sort(key=lambda x: x["date"])
(HERE / "new_tweets.json").write_text(json.dumps(new, ensure_ascii=False, indent=1))
print(f"archive latest post: {latest}; archive rows: {len(rows)}; new posts to label: {len(new)}")
