"""Stance flips: a post whose bull/bear stance on a ticker differs from that ticker's previous bull/bear stance."""


def find_flips(posts):
    prev, out = {}, []
    for p in sorted(posts, key=lambda p: (p["date"], p["id"])):
        for t, s in p["s"].items():
            if s == "neutral":
                continue
            if t in prev and prev[t]["s"] != s and prev[t]["date"] != p["date"]:  # skip same-day back-and-forth
                out.append({"t": t, "date": p["date"], "id": p["id"], "from": prev[t]["s"], "to": s,
                            "prevDate": prev[t]["date"], "prevId": prev[t]["id"]})
            prev[t] = {"s": s, "date": p["date"], "id": p["id"]}
    return out


if __name__ == "__main__":
    import json
    from pathlib import Path
    for f in find_flips(json.loads((Path(__file__).parent / "posts.json").read_text())):
        print(f["date"], f["t"], f["from"], "->", f["to"], "(prev", f["prevDate"] + ")")
