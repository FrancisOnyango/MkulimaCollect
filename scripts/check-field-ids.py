import re
from collections import Counter
from pathlib import Path

files = [
    Path(r"c:\Users\FRANC\Pictures\MkulimaCollect\apps\collect\features\sectors\generatedChainSchemas.ts"),
    Path(r"c:\Users\FRANC\Pictures\MkulimaCollect\apps\collect\features\sectors\sectorSchemas.ts"),
]
ids = []
for path in files:
    ids.extend(re.findall(r'id: "([^"]+)"', path.read_text(encoding="utf-8")))
counts = Counter(ids)
skip = {"herd", "costs", "evidence", "crop", "production", "plantation", "assets", "health"}
dups = [(key, value) for key, value in counts.items() if value > 1 and not key.endswith(("-field-v1", "-field-v2")) and key not in skip]
print("total", len(ids), "unique", len(counts))
print("dups", sorted(dups, key=lambda item: -item[1])[:30])
gen = files[0].read_text(encoding="utf-8")
print("generated chains", len(re.findall(r'^  "[^"]+": schema', gen, re.M)))
web = Path(r"c:\Users\FRANC\Pictures\MkulimaCollect\src\generatedWebSectors.ts").read_text(encoding="utf-8")
print("web chains", web.count("\n    id: "))
