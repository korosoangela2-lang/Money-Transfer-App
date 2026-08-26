from flask import Blueprint, jsonify

from ..rates_store import drift_rates

bp = Blueprint("rates", __name__, url_prefix="/api/rates")


@bp.get("")
def get_rates():
    return jsonify(drift_rates())
