"""Rebuild public/alpha/index.html: tracked accounts' labeled posts (last 90 days) + Serenity's labels."""
import json
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public" / "alpha" / "index.html"
accounts = json.loads((HERE / "accounts.json").read_text())
posts = json.loads((HERE / "posts.json").read_text())
for a in accounts:
    if a.get("source") == "serenity":  # already labeled by the /serenity pipeline
        posts += [{**p, "author": a["handle"]} for p in json.loads((HERE.parent / "serenity" / "posts.json").read_text())]
names = {k: v.get("name", "") for k, v in json.loads((HERE.parent / "serenity" / "analysis.json").read_text()).items()}
as_of = max(p["date"] for p in posts)
L = datetime.fromisoformat(as_of)
posts = sorted(({k: p[k] for k in ("id", "author", "date", "zh", "risk", "s", "text", "likes") if k in p}
                for p in posts if (L - datetime.fromisoformat(p["date"])).days < 90),
               key=lambda p: (p["date"], p["id"]))
ALIAS = {"GOOG": "GOOGL", "APPL": "AAPL"}  # same company under two tickers / common typo
for p in posts:
    p["text"] = p["text"][:1200]
    s = {}
    for t, v in p["s"].items():
        t = ALIAS.get(t, t)
        if t not in s or v != "neutral":
            s[t] = v
    p["s"] = s
analysis = json.loads((HERE / "analysis.json").read_text()) if (HERE / "analysis.json").exists() else {}
data = {"asOf": as_of, "analysis": analysis, "accounts": [{k: v for k, v in a.items() if k != "source"} for a in accounts],
        "posts": posts, "names": names}
blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
OUT.write_text((HERE / "template.html").read_text().replace("/*DATA*/", blob, 1))
by = {}
for p in posts:
    by[p["author"]] = by.get(p["author"], 0) + 1
print(f"built {OUT} as of {as_of}: {len(posts)} posts {by}")
