-- ============================================================================
-- Migration 0002 — carrier profile completeness + seat-layout markers
--
-- 1. companies.emergency_contacts: driver emergency dispatcher contacts
--    (operator onboarding module). A small structured list, not its own
--    table — it has no independent identity, no relations, and is only ever
--    read/written as a whole by the one settings form that owns it.
-- 2. Nothing changes structurally for vehicles/seats: door, toilet, and
--    driver placements from the new Fleet Builder still resolve to either a
--    `seats` row (driver — seat_type already supports it) or a JSON
--    "layout marker" inside vehicles.seat_layout (door/toilet — these were
--    never bookable, so they don't belong in `seats` at all). No column
--    addition needed there; the JSON shape is documented in
--    src/types/database.ts (SeatLayout.layoutMarkers) and enforced at the
--    application layer, same as seat_layout already was.
-- ============================================================================

alter table companies
  add column emergency_contacts jsonb not null default '[]'::jsonb;

comment on column companies.emergency_contacts is
  'Array of {name, phone, role}. Dispatcher/on-call contacts a driver escalates to, separate from the public-facing support_phone.';
