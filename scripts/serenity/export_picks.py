"""Export public/stocks/serenity.json for the 台美股評分台 (/stocks) from posts.json + analysis.json (last 90 days)."""
import json
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public" / "stocks" / "serenity.json"
posts = json.loads((HERE / "posts.json").read_text())
analysis = json.loads((HERE / "analysis.json").read_text())
as_of = max(p["date"] for p in posts)
L = datetime.fromisoformat(as_of)
posts = sorted((p for p in posts if (L - datetime.fromisoformat(p["date"])).days < 90),
               key=lambda p: (p["date"], p["id"]), reverse=True)

picks = []
for tk, a in analysis.items():
    mine = [p for p in posts if tk in p.get("s", {})]
    cnt = {"bull": 0, "bear": 0, "neutral": 0}
    for p in mine:
        cnt[p["s"][tk]] = cnt.get(p["s"][tk], 0) + 1
    evo = a.get("evolution", [])
    picks.append({
        "ticker": tk, "name": a.get("name", ""), "summary": a.get("summary", ""),
        "stance": evo[-1]["stance"] if evo else "neutral",
        "evolution": evo, "risks": a.get("risks", []),
        "mentions": len(mine), "bull": cnt["bull"], "bear": cnt["bear"], "neutral": cnt["neutral"],
        "lastDate": mine[0]["date"] if mine else "",
        "recent": [{"id": p["id"], "date": p["date"], "stance": p["s"][tk], "zh": p.get("zh", ""), "likes": p.get("likes", 0)} for p in mine[:3]],
    })
picks.sort(key=lambda x: -x["mentions"])
OUT.write_text(json.dumps({"asOf": as_of, "author": "@aleabitoreddit", "picks": picks}, ensure_ascii=False, separators=(",", ":")))
print(f"wrote {OUT}: {len(picks)} tickers as of {as_of}")
