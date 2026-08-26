import unittest

from app.store import find_beneficiary, find_user, find_user_by_email, mutate_db, read_db

from .helpers import cleanup, make_app


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.app, self.db_path = make_app()

    def tearDown(self):
        cleanup(self.db_path)

    def test_read_db_creates_an_empty_seed_on_first_read(self):
        with self.app.app_context():
            db = read_db()
        self.assertEqual(db["users"], [])
        self.assertEqual(db["sessions"], {})

    def test_mutate_db_persists_changes(self):
        with self.app.app_context():
            with mutate_db() as db:
                db["users"].append({"id": "usr_TEST", "email": "a@b.com"})
            db2 = read_db()
        self.assertEqual(len(db2["users"]), 1)
        self.assertEqual(db2["users"][0]["id"], "usr_TEST")

    def test_find_user_by_id_and_email(self):
        with self.app.app_context():
            with mutate_db() as db:
                db["users"].append({"id": "usr_1", "email": "Amina@Example.com"})

            db = read_db()
            self.assertEqual(find_user(db, "usr_1")["email"], "Amina@Example.com")
            self.assertIsNone(find_user(db, "usr_missing"))
            # case-insensitive email lookup
            self.assertEqual(find_user_by_email(db, "amina@example.com")["id"], "usr_1")
            self.assertIsNone(find_user_by_email(db, "nobody@example.com"))

    def test_find_beneficiary(self):
        user = {"beneficiaries": [{"id": "ben_1", "name": "Aoko"}]}
        self.assertEqual(find_beneficiary(user, "ben_1")["name"], "Aoko")
        self.assertIsNone(find_beneficiary(user, "ben_missing"))


if __name__ == "__main__":
    unittest.main()
