# ADR-0003: Hosting jurisdiction

## Status
Accepted for now — explicitly revisitable (2026-07-16)

## Context
Phase 00 Open Decision #3. The server runs on Hetzner (Germany). Iranian
payment gateways (Zarinpal/IDPay/Zibal), Shaparak, and eNamad in practice
require an Iranian legal entity and, for gateway callbacks, Iranian hosting.
This decision was explicitly noted as depending on ADR-0002.

## Decision
**Stay on Hetzner for now.** Given ADR-0002 (pass-through monetization, no
payment gateway custody in the current scope), there is no immediate technical
requirement forcing a move to Iranian hosting or forming a legal entity.

## Consequences
- No hosting migration work is scheduled.
- This decision is coupled to ADR-0002: if monetization moves to escrow/
  commission later (Phase 11 Sprint 6), this ADR must be revisited — Iranian
  gateways and eNamad will then push toward Iranian hosting.
- Known infra debt independent of this decision still applies and is unrelated
  to jurisdiction: the origin IP is exposed (Cloudflare proxy disabled), UFW
  rules and Fail2ban are still outstanding (Phase 07).
