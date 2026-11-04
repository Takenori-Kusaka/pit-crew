# Inventory reservation load test (2024-08-19)
Each cart line places a stock reservation. p99 reservation latency:
| lines per cart | p99 latency |
|---|---|
| 40 | 0.8 s |
| 60 | 1.6 s |
| 80 | 3.9 s |
| 100 | 7.2 s |
Checkout times out at 2.0 s.
