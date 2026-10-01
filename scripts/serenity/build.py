"""Rebuild public/serenity/index.html from posts.json + analysis.json (last 90 days)."""
import json
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public" / "serenity" / "index.html"
posts = json.loads((HERE / "posts.json").read_text())
analysis = json.loads((HERE / "analysis.json").read_text())
as_of = max(p["date"] for p in posts)
L = datetime.fromisoformat(as_of)
posts = sorted((p for p in posts if (L - datetime.fromisoformat(p["date"])).days < 90),
               key=lambda p: (p["date"], p["id"]))
names = {k: v.get("name", "") for k, v in analysis.items()}
an = {k: {kk: vv for kk, vv in v.items() if kk != "name"} for k, v in analysis.items()}
data = {"asOf": as_of, "posts": posts, "analysis": an, "names": names, "defaultTicker": "SIVE"}
blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
OUT.write_text((HERE / "template.html").read_text().replace("/*DATA*/", blob, 1))
print(f"built {OUT} as of {as_of}: {len(posts)} posts")
