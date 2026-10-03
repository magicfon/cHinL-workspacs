"""Merge new_labels.json ([{id,s:{TICKER:bull|bear|neutral},zh,risk}]) into posts.json."""
import json
from pathlib import Path

from flips import find_flips

HERE = Path(__file__).parent
new = {t["id"]: t for t in json.loads((HERE / "new_tweets.json").read_text())}
labels = json.loads((HERE / "new_labels.json").read_text())
posts = json.loads((HERE / "posts.json").read_text())
known = {p["id"] for p in posts}
added = 0
for l in labels:
    t = new.get(l["id"])
    if not t or l["id"] in known:
        continue
    s = {k: (l["s"].get(k) if l["s"].get(k) in ("bull", "bear", "neutral") else "neutral") for k in t["tickers"]}
    posts.append({"id": t["id"], "date": t["date"], "zh": l["zh"], "risk": l.get("risk", ""),
                  "s": s, "text": t["text"], "likes": t["likes"]})
    added += 1
missing = set(new) - {l["id"] for l in labels}
if missing:
    raise SystemExit(f"{len(missing)} new posts have no label: {sorted(missing)[:5]}")
posts.sort(key=lambda p: (p["date"], p["id"]))
(HERE / "posts.json").write_text(json.dumps(posts, ensure_ascii=False, indent=0))
print(f"added {added}; total {len(posts)}")
new_ids = {l["id"] for l in labels}
for f in find_flips(posts):
    if f["id"] in new_ids:
        print(f"FLIP {f['t']}: {f['from']} -> {f['to']} on {f['date']} (was {f['from']} since {f['prevDate']})")
