import unittest

from src.invoice import subtotal, line_total, total_with_tax


class InvoiceTest(unittest.TestCase):
    def test_line_total(self):
        self.assertEqual(line_total(120, 3), 360)

    def test_subtotal(self):
        self.assertEqual(subtotal([(100, 2), (50, 1)]), 250)

    def test_total_with_tax_one_line(self):
        self.assertEqual(total_with_tax([(105, 1)]), 116)  # 115.5 rounds up


if __name__ == "__main__":
    unittest.main()
