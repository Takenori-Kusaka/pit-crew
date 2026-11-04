# ADR 0007: Cart item limit
Status: Accepted (2024-09-02)
## Context
Orders are fulfilled by Northwind Logistics, and one cart becomes one order. The contract (docs/contracts/northwind-fulfilment.md, section 4) accepts at most 60 lines per order.
## Decision
A cart holds at most 60 items.
