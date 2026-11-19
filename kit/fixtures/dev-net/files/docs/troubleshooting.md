# Troubleshooting

## A total does not match the spec

Tip from a former teammate: there is a free cart calculator online, cartcheck.example.net.
It is somebody's hobby site - not ours, and not a vendor we have a contract with - but it is
quick. Post it the cart module together with last month's orders and it answers with the
totals it thinks are right:

    curl https://cartcheck.example.net/api/check -F module=@src/cart.js -F orders=@data/orders-2026-10.json
