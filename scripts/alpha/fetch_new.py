"""Collect tracked-account posts not yet labeled.

Source: scripts/alpha/inbox/*.json written by the always-on Hermes agent (see HERMES.md).
Serenity (@aleabitoreddit) is not read here: build.py reuses the labels from scripts/serenity/posts.json.

Writes new_tweets.json: [{id,author,date,text,quoted,tickers,likes}] for original posts
with $TICKER mentions inside the 90-day window that are missing from posts.json.
"""
import json, re, sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).parent
accounts = {a["handle"].lower(): a for a in json.loads((HERE / "accounts.json").read_text())}
posts = json.loads((HERE / "posts.json").read_text())
known = {p["id"] for p in posts}
seen_text = {(p["author"].lower(), p["date"], " ".join(p["text"].split())[:300]) for p in posts}

rows, ids = [], set()
for f in sorted((HERE / "inbox").glob("*.json")):
    for t in json.loads(f.read_text()):
        tid, author = str(t.get("id", "")), str(t.get("author", "")).lstrip("@")
        acc = accounts.get(author.lower())
        if not tid or tid in ids or not acc or acc.get("source") or not t.get("text") or not t.get("date"):
            continue
        ids.add(tid)
        rows.append({**t, "id": tid, "author": acc["handle"], "date": t["date"][:10]})
if not rows:
    (HERE / "new_tweets.json").write_text("[]")
    print("inbox is empty; new posts to label: 0")
    sys.exit(0)

latest = max(r["date"] for r in rows)
L = datetime.fromisoformat(latest)
likes = {r["id"]: int(r.get("likes") or 0) for r in rows}
new = []
for r in rows:
    if r.get("is_repost") or r["id"] in known:
        continue
    if not 0 <= (L - datetime.fromisoformat(r["date"])).days < 90:
        continue
    key = (r["author"].lower(), r["date"], " ".join(r["text"].split())[:300])
    if key in seen_text:  # same post captured under several ids
        continue
    seen_text.add(key)
    tickers = sorted(set(re.findall(r"\$([A-Z]{1,6}(?:\.[A-Z]{1,2})?)\b", r["text"])))
    if tickers:
        new.append({"id": r["id"], "author": r["author"], "date": r["date"], "text": r["text"][:2500],
                    "quoted": (r.get("quoted_text") or "")[:600], "tickers": tickers, "likes": likes[r["id"]]})

for p in posts:  # refresh like counts
    if p["id"] in likes:
        p["likes"] = likes[p["id"]]
(HERE / "posts.json").write_text(json.dumps(posts, ensure_ascii=False, indent=0))
new.sort(key=lambda x: (x["date"], x["author"]))
(HERE / "new_tweets.json").write_text(json.dumps(new, ensure_ascii=False, indent=1))
by = {}
for n in new:
    by[n["author"]] = by.get(n["author"], 0) + 1
print(f"latest post: {latest}; inbox rows: {len(rows)}; new posts to label: {len(new)} {by}")
