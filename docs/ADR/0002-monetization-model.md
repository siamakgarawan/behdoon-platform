# ADR-0002: Monetization model

## Status
Accepted (2026-07-16)

## Context
Phase 00 Open Decision #2. Two options were on the table: pass-through (the
platform introduces customer and provider; money moves directly between them)
vs. escrow/commission (the platform holds funds and releases them on
completion, taking a cut).

## Decision
**Pass-through.** The platform does not hold customer funds. Payment for a job
happens directly between the customer and the provider; Behdoon's role is
discovery, matching, and job tracking, not payment custody.

## Consequences
- No `Payment`, `Payout`, or `Wallet` model is needed for the current scope.
- No Iranian legal entity or Shaparak-licensed payment gateway is required to
  launch — this significantly de-risks and speeds up getting to a working
  product.
- Directly informs ADR-0003 (hosting jurisdiction): without a payment gateway
  holding/moving funds, there is no immediate legal/hosting requirement forcing
  a move off Hetzner.
- Revisit this decision before adding any in-app payment or commission feature
  (Phase 11 Sprint 6, "Trust & money") — that sprint explicitly cannot start
  before this decision, and it may need to be re-opened at that point rather
  than assumed permanent.
