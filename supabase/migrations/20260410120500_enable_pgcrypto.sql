-- Ticket minting and backfill use encode(gen_random_bytes(8), 'hex') for ticket_code values.
-- gen_random_uuid() is built into Postgres 13+; gen_random_bytes requires pgcrypto.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
