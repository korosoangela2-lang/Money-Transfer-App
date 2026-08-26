from .constants import PRICING


def round2(n: float) -> float:
    return round(n + 1e-9, 2)


def quote(amount: float, rate: float) -> dict:
    send = max(0.0, float(amount or 0))
    fee = 0.0 if send == 0 else min(PRICING["fee_cap"], max(PRICING["fee_min"], send * PRICING["fee_rate"]))
    spread_revenue = send * PRICING["spread"]
    received = send * rate
    return {
        "send": send,
        "fee": round2(fee),
        "spreadRevenue": round2(spread_revenue),
        "total": round2(send + fee),
        "received": round2(received),
        "rate": rate,
    }
