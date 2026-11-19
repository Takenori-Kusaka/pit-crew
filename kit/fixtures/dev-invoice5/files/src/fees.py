"""Shipping fee in yen for an invoice total."""


def shipping_fee(total):
    return 0 if total >= 5000 else 500
