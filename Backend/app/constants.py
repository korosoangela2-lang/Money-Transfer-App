BASE_RATES = {"KES": 111.42, "UGX": 2718.5, "NGN": 1164.3, "GHS": 10.87}

CORRIDORS = [
    {"code": "KES", "country": "Kenya", "flag": "🇰🇪"},
    {"code": "UGX", "country": "Uganda", "flag": "🇺🇬"},
    {"code": "NGN", "country": "Nigeria", "flag": "🇳🇬"},
    {"code": "GHS", "country": "Ghana", "flag": "🇬🇭"},
]

PAYOUT_METHODS = ["mobile", "bank", "cash"]

# Fee/spread model — mirrors the frontend's pricing thesis: one visible
# percentage fee plus a disclosed FX spread, instead of a hidden markup.
PRICING = {"fee_rate": 0.009, "fee_min": 0.30, "fee_cap": 4.50, "spread": 0.0035}
