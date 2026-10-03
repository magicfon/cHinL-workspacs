"""Collect @aleabitoreddit posts not yet labeled.

Sources: the public archive CSV, plus scripts/serenity/inbox/*.json written by the
always-on Hermes agent (see HERMES.md). Duplicates are merged by post id.

Writes new_tweets.json: [{id,date,text,quoted,tickers,likes}] for original posts
with $TICKER mentions inside the 90-day window that are missing from posts.json.
"""
import csv, io, json, re, sys, urllib.request
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).parent
SRC = "https://raw.githubusercontent.com/yan-labs/serenity-aleabitoreddit/main/data/aleabitoreddit_tweets.csv"
csv.field_size_limit(10**9)

rows = []
try:
    raw = urllib.request.urlopen(SRC, timeout=300).read().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(raw)))
except Exception as e:  # archive is a fallback; the inbox alone is enough
    print(f"archive download failed: {e}")
archive_ids = {r["id"] for r in rows}
inbox = 0
for f in sorted((HERE / "inbox").glob("*.json")):
    for t in json.loads(f.read_text()):
        tid = str(t["id"])
        if tid in archive_ids or not t.get("text") or not t.get("date"):
            continue
        archive_ids.add(tid)
        inbox += 1
        rows.append({"id": tid, "createdAtISO": t["date"][:10], "text": t["text"],
                     "isRetweet": "True" if t.get("is_repost") else "False",
                     "quoted_text": t.get("quoted_text", ""), "likes": t.get("likes", 0)})
if not rows:
    raise SystemExit("no source data")
posts = json.loads((HERE / "posts.json").read_text())
known = {p["id"] for p in posts}
likes = {r["id"]: int(r["likes"] or 0) for r in rows}

latest = max(r["createdAtISO"][:10] for r in rows)
L = datetime.fromisoformat(latest)
new = []
seen_text = {(p["date"], " ".join(p["text"].split())[:300]) for p in posts}
for r in rows:
    if r["isRetweet"] != "False" or r["id"] in known:
        continue
    age = (L - datetime.fromisoformat(r["createdAtISO"][:10])).days
    if not 0 <= age < 90:
        continue
    tickers = sorted(set(re.findall(r"\$([A-Z]{1,6})\b", r["text"])))
    key = (r["createdAtISO"][:10], " ".join(r["text"].split())[:300])
    if key in seen_text:  # same post captured under several ids
        continue
    seen_text.add(key)
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
print(f"latest post: {latest}; rows: {len(rows)} (inbox-only {inbox}); new posts to label: {len(new)}")
