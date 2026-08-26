import unittest

from app.domain import check_password, new_beneficiary, new_transaction, new_user, public_user


class NewUserTests(unittest.TestCase):
    def test_hashes_the_password_rather_than_storing_it(self):
        user = new_user(name="Amina Hassan", email="amina@example.com", phone="+1 613 555 0100", password="hunter22")
        self.assertNotEqual(user["passwordHash"], "hunter22")
        self.assertTrue(check_password(user, "hunter22"))
        self.assertFalse(check_password(user, "wrong-password"))

    def test_defaults(self):
        user = new_user(name="Amina Hassan", email="amina@example.com", phone="", password="hunter22")
        self.assertEqual(user["role"], "user")
        self.assertEqual(user["kyc"], "unverified")
        self.assertEqual(user["status"], "active")
        self.assertEqual(user["country"], "Canada")
        self.assertEqual(user["wallet"], {"balance": 0, "currency": "CAD"})
        self.assertEqual(user["beneficiaries"], [])
        self.assertEqual(user["transactions"], [])

    def test_ids_are_unique(self):
        u1 = new_user(name="A", email="a@example.com", phone="", password="password1")
        u2 = new_user(name="B", email="b@example.com", phone="", password="password1")
        self.assertNotEqual(u1["id"], u2["id"])
        self.assertTrue(u1["id"].startswith("usr_"))


class PublicUserTests(unittest.TestCase):
    def test_excludes_the_password_hash(self):
        user = new_user(name="Amina Hassan", email="amina@example.com", phone="", password="hunter22")
        public = public_user(user)
        self.assertNotIn("passwordHash", public)
        self.assertNotIn("wallet", public)
        self.assertNotIn("beneficiaries", public)
        self.assertEqual(public["email"], "amina@example.com")


class NewBeneficiaryTests(unittest.TestCase):
    def test_builds_expected_fields(self):
        b = new_beneficiary(name="Aoko Odhiambo", currency="KES", method="mobile")
        self.assertTrue(b["id"].startswith("ben_"))
        self.assertEqual(b["name"], "Aoko Odhiambo")
        self.assertEqual(b["currency"], "KES")
        self.assertEqual(b["method"], "mobile")
        self.assertEqual(b["relation"], "")


class NewTransactionTests(unittest.TestCase):
    def test_rounds_money_fields(self):
        tx = new_transaction(type="send", status="pending", name="Aoko Odhiambo", amount=99.999, fee=1.005)
        self.assertEqual(tx["amount"], 100.0)
        self.assertTrue(tx["id"].startswith("TX_"))
        self.assertIsNotNone(tx["createdAt"])


if __name__ == "__main__":
    unittest.main()
