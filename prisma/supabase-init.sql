-- Optional: run this in the Supabase SQL Editor if you do not use `npx prisma db push`.
-- Prisma uses these table and column names.

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "avatar" BYTEA,
  "avatar_mime" TEXT,
  "avatar_updated_at" TIMESTAMP(3),
  "chat_bg_color" TEXT NOT NULL DEFAULT '',
  "chat_bg" BYTEA,
  "chat_bg_mime" TEXT,
  "chat_bg_updated_at" TIMESTAMP(3)
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" BYTEA;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_mime" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_updated_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "chat_bg_color" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "chat_bg" BYTEA;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "chat_bg_mime" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "chat_bg_updated_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

CREATE TABLE IF NOT EXISTS "people" (
  "id" TEXT PRIMARY KEY,
  "owner_id" TEXT NOT NULL,
  "user_id" TEXT,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "people_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "people_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "people_owner_id_idx" ON "people"("owner_id");
CREATE INDEX IF NOT EXISTS "people_user_id_idx" ON "people"("user_id");

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" TEXT PRIMARY KEY,
  "owner_id" TEXT NOT NULL,
  "person_id" TEXT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "category" TEXT NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "spent_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expenses_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "expenses_person_id_fkey"
    FOREIGN KEY ("person_id") REFERENCES "people"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "expenses_owner_id_idx" ON "expenses"("owner_id");
CREATE INDEX IF NOT EXISTS "expenses_person_id_idx" ON "expenses"("person_id");
CREATE INDEX IF NOT EXISTS "expenses_spent_at_idx" ON "expenses"("spent_at");

CREATE TABLE IF NOT EXISTS "invites" (
  "id" TEXT PRIMARY KEY,
  "owner_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invites_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "invites_token_key" ON "invites"("token");
CREATE INDEX IF NOT EXISTS "invites_owner_id_idx" ON "invites"("owner_id");
CREATE INDEX IF NOT EXISTS "invites_email_status_idx" ON "invites"("email", "status");

CREATE TABLE IF NOT EXISTS "notebook_shares" (
  "id" TEXT PRIMARY KEY,
  "owner_id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notebook_shares_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notebook_shares_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "notebook_shares_owner_id_member_id_key"
  ON "notebook_shares"("owner_id", "member_id");
CREATE INDEX IF NOT EXISTS "notebook_shares_member_id_idx" ON "notebook_shares"("member_id");

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" TEXT PRIMARY KEY,
  "sender_id" TEXT NOT NULL,
  "recipient_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chat_messages_recipient_id_fkey"
    FOREIGN KEY ("recipient_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "chat_messages_sender_id_created_at_idx"
  ON "chat_messages"("sender_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_messages_recipient_id_created_at_idx"
  ON "chat_messages"("recipient_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_messages_sender_id_recipient_id_created_at_idx"
  ON "chat_messages"("sender_id", "recipient_id", "created_at");
