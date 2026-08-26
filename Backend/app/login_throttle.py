"""In-memory brute-force guard for /api/auth/login.

Per-process only (like rates_store) — fine for a single dev/demo server,
not a substitute for a shared store under multiple workers.
"""

import threading
import time

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 15 * 60
LOCKOUT_SECONDS = 15 * 60

_lock = threading.Lock()
_failures = {}  # email -> [failure timestamps within WINDOW_SECONDS]
_locked_until = {}  # email -> unix timestamp the lockout ends


def seconds_locked(email):
    """Seconds remaining on an active lockout for this email, or None."""
    with _lock:
        until = _locked_until.get(email)
        if until and until > time.time():
            return int(until - time.time())
        return None


def record_failure(email):
    with _lock:
        now = time.time()
        attempts = [t for t in _failures.get(email, []) if now - t < WINDOW_SECONDS]
        attempts.append(now)
        if len(attempts) >= MAX_ATTEMPTS:
            _locked_until[email] = now + LOCKOUT_SECONDS
            attempts = []
        _failures[email] = attempts


def record_success(email):
    with _lock:
        _failures.pop(email, None)
        _locked_until.pop(email, None)


def reset():
    """Test-only: clear all throttle state between test cases."""
    with _lock:
        _failures.clear()
        _locked_until.clear()
