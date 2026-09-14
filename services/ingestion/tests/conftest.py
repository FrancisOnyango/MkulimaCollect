from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

TMP = Path(tempfile.mkdtemp(prefix="mkulima-ingestion-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(TMP / 'pipeline.db').as_posix()}"
