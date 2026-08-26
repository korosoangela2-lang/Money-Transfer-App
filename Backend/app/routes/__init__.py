from .auth import bp as auth_bp
from .rates import bp as rates_bp
from .wallet import bp as wallet_bp
from .beneficiaries import bp as beneficiaries_bp
from .transactions import bp as transactions_bp, transfers_bp
from .requests import bp as requests_bp
from .admin import bp as admin_bp

ALL_BLUEPRINTS = [auth_bp, rates_bp, wallet_bp, beneficiaries_bp, transactions_bp, transfers_bp, requests_bp, admin_bp]
