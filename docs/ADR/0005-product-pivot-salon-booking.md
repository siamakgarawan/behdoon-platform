# ADR-0005: Product pivot — salon/beauty appointment marketplace

## Status
Accepted (2026-07-17), supersedes the mission statement in Phase 00 of
BEHDOON_CLAUDE_HANDBOOK.md

## Context
The original handbook defined Behdoon as a home-services marketplace
(a tradesperson travels to the customer's address) and explicitly ruled out
a salon-style slot-booking product, stating that distinction "drives the
whole data model." Everything built through ADR-0004 — the `Job` lifecycle
(`REQUESTED → QUOTED → ACCEPTED → SCHEDULED → IN_PROGRESS → COMPLETED → PAID`),
`Address` (customer's home), `ServiceArea` (provider travel radius), and
`Quote` (post-inspection pricing) — was built specifically for that model.

The user has now explicitly reversed this: Behdoon is a marketplace for
salons and individual hairdressers/beauticians, where customers view a
salon's profile and services and book a specific appointment time. This is
exactly the "salon-style slot-booking product" the original mission ruled
out — not an addition alongside home services, a full replacement of it.

## Decision
Behdoon's product is a salon/beauty appointment-booking marketplace.

- `ProviderProfile` → `Salon`: a business (or solo stylist) profile with a
  fixed location (city + address), not a travel radius.
- `Job`/`Quote` are removed entirely and replaced by `Appointment`: a
  specific `startAt`/`endAt` time slot for one service at one salon,
  booked by one customer. No inspection-based quoting — a service has a
  fixed price and duration set by the salon.
- `ServiceArea` is removed (a salon has one location, not a coverage
  radius). `Address` as "customer's job site" is removed — the customer
  goes to the salon, not the reverse.
- New `WorkingHour` model: a salon's recurring weekly open hours, used to
  compute bookable slots together with existing appointments (so the same
  slot can't be double-booked — a gap the original v1 schema explicitly
  left open and that a real slot-booking product cannot ship without).

## Consequences
- All Job/Quote/ServiceArea/Address code, migrations-forward, and tests
  from this session are dead code and are being removed, not kept
  alongside the new model. There was no real production data to migrate
  (confirmed empty before this change) — this is a clean schema
  replacement, not a data migration.
- ADR-0001 (auth), ADR-0002 (pass-through monetization), ADR-0003
  (hosting) are unaffected by this pivot and remain in force.
- ADR-0004 (pricing: fixed + hourly + on-site quote) is superseded for
  services: salon services are fixed price + fixed duration (no
  on-site-quote path — there's nothing to inspect before a haircut).
- BEHDOON_CLAUDE_HANDBOOK.md's Phase 00 mission statement, Phase 05
  schema section, and Phase 12 task list describe the old model and are
  now stale; they should be rewritten in a follow-up rather than
  continuing to guide work from the outdated version.
