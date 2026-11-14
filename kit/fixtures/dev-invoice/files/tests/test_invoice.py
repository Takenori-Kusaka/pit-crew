import unittest

from src.invoice import subtotal, line_total


class InvoiceTest(unittest.TestCase):
    def test_line_total(self):
        self.assertEqual(line_total(120, 3), 360)

    def test_subtotal(self):
        self.assertEqual(subtotal([(100, 2), (50, 1)]), 250)


if __name__ == "__main__":
    unittest.main()
