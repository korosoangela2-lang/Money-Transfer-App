import unittest

from app.pricing import PRICING, quote, round2


class RoundTwoTests(unittest.TestCase):
    def test_rounds_to_two_decimals(self):
        self.assertEqual(round2(3.14159), 3.14)
        self.assertEqual(round2(10), 10)


class QuoteTests(unittest.TestCase):
    def test_fee_clamped_to_floor_on_small_amounts(self):
        q = quote(10, 100)
        self.assertEqual(q["fee"], PRICING["fee_min"])

    def test_fee_clamped_to_cap_on_large_amounts(self):
        q = quote(10000, 100)
        self.assertEqual(q["fee"], PRICING["fee_cap"])

    def test_plain_percentage_fee_in_unclamped_range(self):
        q = quote(100, 100)
        self.assertAlmostEqual(q["fee"], 100 * PRICING["fee_rate"], places=2)

    def test_received_uses_the_given_rate(self):
        q = quote(50, 110.5)
        self.assertAlmostEqual(q["received"], 50 * 110.5, places=2)

    def test_total_is_send_plus_fee(self):
        q = quote(200, 100)
        self.assertAlmostEqual(q["total"], q["send"] + q["fee"], places=5)

    def test_zero_or_negative_amount_sends_nothing(self):
        self.assertEqual(quote(0, 100)["fee"], 0)
        self.assertEqual(quote(-50, 100)["send"], 0)
        self.assertEqual(quote(-50, 100)["fee"], 0)


if __name__ == "__main__":
    unittest.main()
