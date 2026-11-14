"""Invoice totals in yen. Each line is (unit_price, quantity). Consumption tax is 10%."""

TAX_RATE = 0.10


def line_total(unit_price, quantity):
    return unit_price * quantity


def subtotal(lines):
    return sum(line_total(p, q) for p, q in lines)


def total_with_tax(lines):
    # tax is rounded on every line, then added up
    return sum(round(line_total(p, q) * (1 + TAX_RATE)) for p, q in lines)
