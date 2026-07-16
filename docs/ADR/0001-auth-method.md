# ADR-0001: Authentication method

## Status
Accepted (2026-07-16)

## Context
Phase 00 Open Decision #1. The initial build used email + password + bcrypt + JWT
(`AuthModule`, tested end-to-end). The Iranian consumer-marketplace standard is
phone number + OTP, which most home-service customers and providers expect and
trust more than an email/password flow.

## Decision
Support **both** mechanisms rather than replacing one with the other:

- **Phone + OTP** is the primary authentication path for `CUSTOMER` and
  `PROVIDER` accounts.
- **Email + password** is retained, primarily for `ADMIN` accounts and any
  back-office/API access where an OTP round-trip is impractical.

## Consequences
- `User.email` can no longer be the sole unique login identity; `User.phone`
  becomes a required, unique field for customer/provider accounts. Schema
  migration required (Phase 05 already flags this).
- A new OTP delivery mechanism is needed: generate a short-lived code, store it
  in Redis (per Phase 01, OTP belongs in Redis, not Postgres), send it via an
  SMS provider, and verify it against a rate-limited endpoint.
- **SMS provider is not yet chosen.** The handbook lists Kavenegar, Melipayamak,
  IPPanel, and SMS.ir as the candidates carried over from the Begir PRD. This
  needs an account + API key before implementation starts — Claude Code cannot
  select or provision this on its own.
- Rate limiting is required per-phone and per-IP for OTP requests (Phase 07).
- `AuthModule`, `JwtStrategy`, and the DTOs need substantial rework; this is
  Sprint 1 in the roadmap (Phase 11), not a small patch.
- Existing email+password users (the two seeded rows / test accounts) keep
  working unchanged.
