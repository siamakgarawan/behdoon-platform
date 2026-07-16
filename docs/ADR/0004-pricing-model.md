# ADR-0004: Per-service pricing model

## Status
Accepted (2026-07-16)

## Context
Phase 00 Open Decision #4. The current schema (`Service.price Int`) assumes a
single fixed price per service, which does not fit most home services (a leak
repair or renovation job is commonly quoted after an on-site inspection).

## Decision
Support three pricing modes per service: **fixed**, **hourly**, and **on-site
quote** (quoted by the provider after inspecting the job in person).

## Consequences
- `Service` needs a `priceType` field (`FIXED | HOURLY | QUOTE` enum, naming
  TBD at migration time) instead of assuming a single `price: Int`.
- A new `Quote` model is required for the on-site-quote path, plus at least two
  additional lifecycle states on the booking/job model to represent
  "awaiting quote" and "quote accepted" (Phase 05's proposed lifecycle:
  `REQUESTED → QUOTED → ACCEPTED → SCHEDULED → IN_PROGRESS → COMPLETED → PAID`
  already anticipates this).
- This is part of the Phase 05 §Known gaps schema redesign (`Booking` → `Job`),
  scheduled as Phase 11 Sprint 2 / Phase 12 Task 8, and blocks Tasks 8–11
  (schema v2, Categories/Services CRUD, Providers CRUD, Jobs lifecycle) until
  that migration lands.
- Money remains integer Rial throughout (Phase 05 §Rules for schema changes) —
  this decision does not change the currency rule, only how a price is
  arrived at.
