-- These optional fields are already used by the survey API and Prisma model.
-- Preserve existing survey responses and tolerate databases updated with db push.
ALTER TABLE "SurveyResponse"
  ADD COLUMN IF NOT EXISTS "orderId" TEXT,
  ADD COLUMN IF NOT EXISTS "customerEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "customerName" TEXT,
  ADD COLUMN IF NOT EXISTS "shop" TEXT;
