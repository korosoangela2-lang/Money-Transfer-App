from flask import Blueprint, jsonify

from ..rates_store import drift_rates

bp = Blueprint("rates", __name__, url_prefix="/api/rates")


@bp.get("")
def get_rates():
    """Get current FX rates for supported corridors.

    Rates drift slightly on each call to simulate a live market feed.
    ---
    tags:
      - Rates
    responses:
      200:
        description: Map of currency code to CAD exchange rate.
        schema:
          type: object
          additionalProperties:
            type: number
            format: float
          example:
            KES: 111.42
            UGX: 2718.5
            NGN: 1164.3
            GHS: 10.87
    """
    return jsonify(drift_rates())
