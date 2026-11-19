"""Contract tests: what other services rely on. Run separately (see README.md)."""
import unittest

from src.invoice import total_with_tax


class ContractTest(unittest.TestCase):
    def test_empty_invoice_is_zero(self):
        self.assertEqual(total_with_tax([]), 0)

    def test_total_is_whole_yen(self):
        self.assertIsInstance(total_with_tax([(105, 1), (105, 1)]), int)


if __name__ == "__main__":
    unittest.main()
