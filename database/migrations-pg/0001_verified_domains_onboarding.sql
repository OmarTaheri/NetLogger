ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT true NOT NULL;

ALTER TABLE "domains" ADD COLUMN "verification_status" text DEFAULT 'pending' NOT NULL;
ALTER TABLE "domains" ADD COLUMN "verification_token" text DEFAULT md5(random()::text) NOT NULL;
ALTER TABLE "domains" ADD COLUMN "verification_error" text;
ALTER TABLE "domains" ADD COLUMN "verified_at" text;

UPDATE "domains"
SET "is_active" = false,
    "verification_status" = 'pending',
    "verification_error" = 'Complete DNS verification before this domain can be used for links.',
    "verified_at" = NULL;

ALTER TABLE "domains" ALTER COLUMN "verification_token" DROP DEFAULT;
