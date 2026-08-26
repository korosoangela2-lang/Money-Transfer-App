import random
import threading
from datetime import datetime, timezone

from .constants import BASE_RATES

_lock = threading.Lock()
_pairs = dict(BASE_RATES)
_updated_at = None


def drift_rates():
    """Nudges each pair by a small random drift, like a live feed.

    In-memory only (no file I/O, no lock shared with db.json writes) since
    this is synthetic drift data, not persisted business data.
    """
    global _updated_at
    with _lock:
        for code, base in BASE_RATES.items():
            prev = _pairs.get(code, base)
            drift = 1 + (random.random() - 0.5) * 0.006
            _pairs[code] = round(prev * drift, 4) or prev
        _updated_at = datetime.now(timezone.utc).isoformat()
        return {**_pairs, "updatedAt": _updated_at}


def current_pairs():
    with _lock:
        return dict(_pairs)
