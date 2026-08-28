import unittest

from app.login_throttle import MAX_ATTEMPTS
from app.store import read_db

from .helpers import cleanup, make_app


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app, self.db_path = make_app()
        self.client = self.app.test_client()

    def tearDown(self):
        cleanup(self.db_path)

    def register(self, email="amina@example.com", password="hunter2222", **overrides):
        body = {
            "name": "Amina Hassan",
            "email": email,
            "phone": "+1 613 555 0100",
            "country": "Canada",
            "password": password,
        }
        body.update(overrides)
        return self.client.post("/api/auth/register", json=body)

    def auth_headers(self, token):
        return {"Authorization": f"Bearer {token}"}


class RegisterLoginTests(ApiTestCase):
    def test_register_returns_a_session(self):
        res = self.register()
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "amina@example.com")
        self.assertEqual(data["user"]["role"], "user")
        self.assertNotIn("passwordHash", data["user"])
        self.assertEqual(data["wallet"], {"balance": 0, "currency": "CAD"})
        self.assertEqual(data["beneficiaries"], [])
        self.assertEqual(data["transactions"], [])

    def test_register_rejects_short_password(self):
        res = self.register(password="short")
        self.assertEqual(res.status_code, 400)

    def test_register_rejects_short_phone(self):
        res = self.register(phone="123")
        self.assertEqual(res.status_code, 400)

    def test_register_rejects_duplicate_email(self):
        self.register()
        res = self.register()
        self.assertEqual(res.status_code, 409)

    def test_login_succeeds_with_correct_credentials(self):
        self.register(email="amina@example.com", password="hunter2222")
        res = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "hunter2222"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("token", res.get_json())

    def test_login_rejects_wrong_password(self):
        self.register(email="amina@example.com", password="hunter2222")
        res = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "wrong-password"})
        self.assertEqual(res.status_code, 401)

    def test_login_rejects_unknown_email(self):
        res = self.client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "hunter2222"})
        self.assertEqual(res.status_code, 404)

    def test_login_locks_out_after_too_many_failed_attempts(self):
        self.register(email="amina@example.com", password="hunter2222")
        for _ in range(MAX_ATTEMPTS):
            res = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "wrong"})
            self.assertEqual(res.status_code, 401)

        locked = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "hunter2222"})
        self.assertEqual(locked.status_code, 429)

    def test_login_succeeding_clears_the_failure_count(self):
        self.register(email="amina@example.com", password="hunter2222")
        self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "wrong"})
        ok = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "hunter2222"})
        self.assertEqual(ok.status_code, 200)

        for _ in range(MAX_ATTEMPTS - 1):
            res = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "wrong"})
            self.assertEqual(res.status_code, 401)
        still_open = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "hunter2222"})
        self.assertEqual(still_open.status_code, 200)


class PasswordResetTests(ApiTestCase):
    def _issue_reset_token(self, email="amina@example.com"):
        self.client.post("/api/auth/forgot-password", json={"email": email})
        with self.app.app_context():
            db = read_db()
        return next(iter(db["passwordResets"]))

    def test_forgot_password_gives_a_generic_response_for_unknown_email(self):
        res = self.client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("message", res.get_json())

    def test_forgot_password_gives_the_same_response_for_a_known_email(self):
        self.register(email="amina@example.com")
        known = self.client.post("/api/auth/forgot-password", json={"email": "amina@example.com"})
        unknown = self.client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
        self.assertEqual(known.get_json(), unknown.get_json())

    def test_reset_password_with_a_valid_token_changes_the_password(self):
        self.register(email="amina@example.com", password="hunter2222")
        token = self._issue_reset_token()

        res = self.client.post("/api/auth/reset-password", json={"token": token, "password": "new-password1"})
        self.assertEqual(res.status_code, 200)

        old = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "hunter2222"})
        self.assertEqual(old.status_code, 401)
        new = self.client.post("/api/auth/login", json={"email": "amina@example.com", "password": "new-password1"})
        self.assertEqual(new.status_code, 200)

    def test_reset_password_token_is_single_use(self):
        self.register(email="amina@example.com")
        token = self._issue_reset_token()
        self.client.post("/api/auth/reset-password", json={"token": token, "password": "new-password1"})

        res = self.client.post("/api/auth/reset-password", json={"token": token, "password": "another-password2"})
        self.assertEqual(res.status_code, 400)

    def test_reset_password_rejects_a_bogus_token(self):
        res = self.client.post("/api/auth/reset-password", json={"token": "not-a-real-token", "password": "new-password1"})
        self.assertEqual(res.status_code, 400)

    def test_reset_password_rejects_a_short_password(self):
        self.register(email="amina@example.com")
        token = self._issue_reset_token()
        res = self.client.post("/api/auth/reset-password", json={"token": token, "password": "short"})
        self.assertEqual(res.status_code, 400)

    def test_reset_password_invalidates_existing_sessions(self):
        session_token = self.register(email="amina@example.com").get_json()["token"]
        reset_token = self._issue_reset_token()
        self.client.post("/api/auth/reset-password", json={"token": reset_token, "password": "new-password1"})

        res = self.client.get("/api/auth/session", headers=self.auth_headers(session_token))
        self.assertEqual(res.status_code, 401)


class SessionTests(ApiTestCase):
    def test_session_resumes_with_a_valid_token(self):
        token = self.register().get_json()["token"]
        res = self.client.get("/api/auth/session", headers=self.auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["user"]["email"], "amina@example.com")

    def test_session_rejects_missing_token(self):
        res = self.client.get("/api/auth/session")
        self.assertEqual(res.status_code, 401)

    def test_session_rejects_bogus_token(self):
        res = self.client.get("/api/auth/session", headers=self.auth_headers("not-a-real-token"))
        self.assertEqual(res.status_code, 401)

    def test_logout_invalidates_the_token(self):
        token = self.register().get_json()["token"]
        self.client.post("/api/auth/logout", headers=self.auth_headers(token))
        res = self.client.get("/api/auth/session", headers=self.auth_headers(token))
        self.assertEqual(res.status_code, 401)


class ProfileTests(ApiTestCase):
    def test_updates_name_and_email(self):
        token = self.register().get_json()["token"]
        res = self.client.patch("/api/auth/me", headers=self.auth_headers(token), json={"name": "New Name", "email": "new@example.com"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["name"], "New Name")
        self.assertEqual(res.get_json()["email"], "new@example.com")

    def test_rejects_taking_someone_elses_email(self):
        self.register(email="taken@example.com")
        token = self.register(email="mine@example.com").get_json()["token"]
        res = self.client.patch("/api/auth/me", headers=self.auth_headers(token), json={"email": "taken@example.com"})
        self.assertEqual(res.status_code, 409)


class RatesTests(ApiTestCase):
    def test_returns_all_corridor_pairs(self):
        res = self.client.get("/api/rates")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        for code in ("KES", "UGX", "NGN", "GHS"):
            self.assertIn(code, data)
        self.assertIn("updatedAt", data)


class WalletTests(ApiTestCase):
    def test_add_funds_increases_balance(self):
        token = self.register().get_json()["token"]
        res = self.client.post("/api/wallet/add-funds", headers=self.auth_headers(token), json={"amount": 50, "source": "Visa"})
        self.assertEqual(res.status_code, 201)
        tx = res.get_json()
        self.assertEqual(tx["type"], "topup")
        self.assertEqual(tx["amount"], 50)

        session = self.client.get("/api/auth/session", headers=self.auth_headers(token)).get_json()
        self.assertEqual(session["wallet"]["balance"], 50)

    def test_rejects_non_positive_amount(self):
        token = self.register().get_json()["token"]
        res = self.client.post("/api/wallet/add-funds", headers=self.auth_headers(token), json={"amount": 0})
        self.assertEqual(res.status_code, 400)

    def test_withdraw_decreases_balance(self):
        token = self.register().get_json()["token"]
        self.client.post("/api/wallet/add-funds", headers=self.auth_headers(token), json={"amount": 100, "source": "Visa"})
        res = self.client.post("/api/wallet/withdraw", headers=self.auth_headers(token), json={"amount": 40, "destination": "Visa"})
        self.assertEqual(res.status_code, 201)
        tx = res.get_json()
        self.assertEqual(tx["type"], "withdrawal")

        session = self.client.get("/api/auth/session", headers=self.auth_headers(token)).get_json()
        self.assertEqual(session["wallet"]["balance"], 60)

    def test_withdraw_rejects_amount_over_balance(self):
        token = self.register().get_json()["token"]
        res = self.client.post("/api/wallet/withdraw", headers=self.auth_headers(token), json={"amount": 10})
        self.assertEqual(res.status_code, 400)


class BeneficiaryTests(ApiTestCase):
    def add_beneficiary(self, token, **overrides):
        body = {"name": "Aoko Odhiambo", "currency": "KES", "method": "mobile"}
        body.update(overrides)
        return self.client.post("/api/beneficiaries", headers=self.auth_headers(token), json=body)

    def test_add_and_list(self):
        token = self.register().get_json()["token"]
        self.add_beneficiary(token)
        res = self.client.get("/api/beneficiaries", headers=self.auth_headers(token))
        self.assertEqual(len(res.get_json()), 1)

    def test_remove(self):
        token = self.register().get_json()["token"]
        beneficiary_id = self.add_beneficiary(token).get_json()["id"]
        res = self.client.delete(f"/api/beneficiaries/{beneficiary_id}", headers=self.auth_headers(token))
        self.assertEqual(res.status_code, 200)
        res = self.client.get("/api/beneficiaries", headers=self.auth_headers(token))
        self.assertEqual(res.get_json(), [])

    def test_cannot_remove_someone_elses_beneficiary(self):
        token_a = self.register(email="a@example.com").get_json()["token"]
        token_b = self.register(email="b@example.com").get_json()["token"]
        beneficiary_id = self.add_beneficiary(token_a).get_json()["id"]
        res = self.client.delete(f"/api/beneficiaries/{beneficiary_id}", headers=self.auth_headers(token_b))
        self.assertEqual(res.status_code, 404)


class TransferTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.token = self.register().get_json()["token"]
        self.client.post("/api/wallet/add-funds", headers=self.auth_headers(self.token), json={"amount": 1000, "source": "Visa"})
        self.beneficiary_id = self.client.post(
            "/api/beneficiaries",
            headers=self.auth_headers(self.token),
            json={"name": "Aoko Odhiambo", "currency": "KES", "method": "mobile"},
        ).get_json()["id"]

    def test_send_money_deducts_balance_and_records_a_pending_transaction(self):
        res = self.client.post(
            "/api/transfers",
            headers=self.auth_headers(self.token),
            json={"beneficiaryId": self.beneficiary_id, "amount": 100, "method": "mobile"},
        )
        self.assertEqual(res.status_code, 201)
        tx = res.get_json()
        self.assertEqual(tx["status"], "pending")
        self.assertEqual(tx["type"], "send")
        self.assertGreater(tx["fee"], 0)
        self.assertGreater(tx["received"], 0)

        session = self.client.get("/api/auth/session", headers=self.auth_headers(self.token)).get_json()
        self.assertAlmostEqual(session["wallet"]["balance"], 1000 - tx["amount"] - tx["fee"], places=2)

    def test_rejects_amount_over_balance(self):
        res = self.client.post(
            "/api/transfers",
            headers=self.auth_headers(self.token),
            json={"beneficiaryId": self.beneficiary_id, "amount": 1_000_000, "method": "mobile"},
        )
        self.assertEqual(res.status_code, 400)

    def test_rejects_unknown_beneficiary(self):
        res = self.client.post(
            "/api/transfers",
            headers=self.auth_headers(self.token),
            json={"beneficiaryId": "ben_does_not_exist", "amount": 10, "method": "mobile"},
        )
        self.assertEqual(res.status_code, 404)

    def test_server_computes_pricing_ignoring_a_client_supplied_fee(self):
        """A client can't smuggle its own fee/rate/received in — the body doesn't even accept them."""
        res = self.client.post(
            "/api/transfers",
            headers=self.auth_headers(self.token),
            json={"beneficiaryId": self.beneficiary_id, "amount": 100, "method": "mobile", "fee": 0, "rate": 999999},
        )
        tx = res.get_json()
        self.assertNotEqual(tx["rate"], 999999)
        self.assertGreater(tx["fee"], 0)


class P2PTransferTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.token = self.register().get_json()["token"]
        self.client.post("/api/wallet/add-funds", headers=self.auth_headers(self.token), json={"amount": 500, "source": "Visa"})
        self.other_token = self.register(email="badru@example.com").get_json()["token"]

    def test_sends_between_two_halcyon_wallets(self):
        res = self.client.post(
            "/api/transfers/to-user",
            headers=self.auth_headers(self.token),
            json={"email": "badru@example.com", "amount": 100},
        )
        self.assertEqual(res.status_code, 201)
        tx = res.get_json()
        self.assertEqual(tx["type"], "p2p_out")
        self.assertEqual(tx["status"], "completed")

        sender = self.client.get("/api/auth/session", headers=self.auth_headers(self.token)).get_json()
        self.assertAlmostEqual(sender["wallet"]["balance"], 400, places=2)

        recipient = self.client.get("/api/auth/session", headers=self.auth_headers(self.other_token)).get_json()
        self.assertAlmostEqual(recipient["wallet"]["balance"], 100, places=2)
        self.assertEqual(recipient["transactions"][0]["type"], "p2p_in")

    def test_rejects_sending_to_yourself(self):
        res = self.client.post(
            "/api/transfers/to-user",
            headers=self.auth_headers(self.token),
            json={"email": "amina@example.com", "amount": 10},
        )
        self.assertEqual(res.status_code, 400)

    def test_rejects_unknown_pay_id(self):
        res = self.client.post(
            "/api/transfers/to-user",
            headers=self.auth_headers(self.token),
            json={"email": "nobody@example.com", "amount": 10},
        )
        self.assertEqual(res.status_code, 404)

    def test_rejects_amount_over_balance(self):
        res = self.client.post(
            "/api/transfers/to-user",
            headers=self.auth_headers(self.token),
            json={"email": "badru@example.com", "amount": 1_000_000},
        )
        self.assertEqual(res.status_code, 400)


class MoneyRequestTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.requester_token = self.register().get_json()["token"]
        self.payer_token = self.register(email="badru@example.com").get_json()["token"]
        self.client.post("/api/wallet/add-funds", headers=self.auth_headers(self.payer_token), json={"amount": 200, "source": "Visa"})

    def create(self, amount=50, note="", token=None):
        return self.client.post(
            "/api/requests",
            headers=self.auth_headers(token or self.requester_token),
            json={"email": "badru@example.com", "amount": amount, "note": note},
        )

    def test_creates_a_pending_request_visible_to_both_sides(self):
        res = self.create(amount=50, note="rent")
        self.assertEqual(res.status_code, 201)
        req = res.get_json()
        self.assertEqual(req["status"], "pending")
        self.assertEqual(req["amount"], 50)

        outgoing = self.client.get("/api/requests", headers=self.auth_headers(self.requester_token)).get_json()
        self.assertEqual(len(outgoing["outgoing"]), 1)
        self.assertEqual(len(outgoing["incoming"]), 0)

        incoming = self.client.get("/api/requests", headers=self.auth_headers(self.payer_token)).get_json()
        self.assertEqual(len(incoming["incoming"]), 1)
        self.assertEqual(incoming["incoming"][0]["requesterName"], "Amina Hassan")

    def test_rejects_requesting_from_yourself(self):
        res = self.client.post(
            "/api/requests",
            headers=self.auth_headers(self.requester_token),
            json={"email": "amina@example.com", "amount": 10},
        )
        self.assertEqual(res.status_code, 400)

    def test_rejects_unknown_pay_id(self):
        res = self.client.post(
            "/api/requests",
            headers=self.auth_headers(self.requester_token),
            json={"email": "nobody@example.com", "amount": 10},
        )
        self.assertEqual(res.status_code, 404)

    def test_paying_moves_funds_and_settles_the_request(self):
        req_id = self.create(amount=50).get_json()["id"]
        res = self.client.post(f"/api/requests/{req_id}/pay", headers=self.auth_headers(self.payer_token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["status"], "paid")

        payer = self.client.get("/api/auth/session", headers=self.auth_headers(self.payer_token)).get_json()
        self.assertAlmostEqual(payer["wallet"]["balance"], 150, places=2)
        requester = self.client.get("/api/auth/session", headers=self.auth_headers(self.requester_token)).get_json()
        self.assertAlmostEqual(requester["wallet"]["balance"], 50, places=2)

    def test_only_the_payer_can_pay_it(self):
        req_id = self.create(amount=50).get_json()["id"]
        res = self.client.post(f"/api/requests/{req_id}/pay", headers=self.auth_headers(self.requester_token))
        self.assertEqual(res.status_code, 404)

    def test_declining_settles_it_without_moving_funds(self):
        req_id = self.create(amount=50).get_json()["id"]
        res = self.client.post(f"/api/requests/{req_id}/decline", headers=self.auth_headers(self.payer_token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["status"], "declined")

        payer = self.client.get("/api/auth/session", headers=self.auth_headers(self.payer_token)).get_json()
        self.assertAlmostEqual(payer["wallet"]["balance"], 200, places=2)

    def test_cannot_pay_an_already_settled_request(self):
        req_id = self.create(amount=50).get_json()["id"]
        self.client.post(f"/api/requests/{req_id}/decline", headers=self.auth_headers(self.payer_token))
        res = self.client.post(f"/api/requests/{req_id}/pay", headers=self.auth_headers(self.payer_token))
        self.assertEqual(res.status_code, 400)


class AdminTests(ApiTestCase):
    def make_admin(self, email="admin@example.com"):
        from app.domain import new_user
        from app.store import mutate_db

        with self.app.app_context():
            with mutate_db() as db:
                user = new_user(name="Admin", email=email, phone="", password="adminpass1", role="admin")
                db["users"].append(user)
        res = self.client.post("/api/auth/login", json={"email": email, "password": "adminpass1"})
        return res.get_json()["token"]

    def test_non_admin_is_forbidden(self):
        token = self.register().get_json()["token"]
        res = self.client.get("/api/admin/data", headers=self.auth_headers(token))
        self.assertEqual(res.status_code, 403)

    def test_admin_can_view_aggregated_data(self):
        self.register()
        admin_token = self.make_admin()
        res = self.client.get("/api/admin/data", headers=self.auth_headers(admin_token))
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("users", data)
        self.assertIn("transactions", data)
        self.assertIn("revenue", data)
        self.assertEqual(len(data["users"]), 2)  # the registered user + the admin

    def test_admin_can_update_and_delete_a_user(self):
        user_id = self.register().get_json()["user"]["id"]
        admin_token = self.make_admin()

        res = self.client.patch(f"/api/admin/users/{user_id}", headers=self.auth_headers(admin_token), json={"status": "suspended"})
        self.assertEqual(res.status_code, 200)

        res = self.client.delete(f"/api/admin/users/{user_id}", headers=self.auth_headers(admin_token))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["id"], user_id)

    def test_admin_can_adjust_a_users_wallet_balance(self):
        user_id = self.register().get_json()["user"]["id"]
        admin_token = self.make_admin()

        res = self.client.patch(f"/api/admin/users/{user_id}", headers=self.auth_headers(admin_token), json={"balance": 250.5})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["patch"]["balance"], 250.5)

        res = self.client.get("/api/admin/data", headers=self.auth_headers(admin_token))
        updated = next(u for u in res.get_json()["users"] if u["id"] == user_id)
        self.assertEqual(updated["balance"], 250.5)

        res = self.client.patch(f"/api/admin/users/{user_id}", headers=self.auth_headers(admin_token), json={"balance": -5})
        self.assertEqual(res.status_code, 400)


if __name__ == "__main__":
    unittest.main()
