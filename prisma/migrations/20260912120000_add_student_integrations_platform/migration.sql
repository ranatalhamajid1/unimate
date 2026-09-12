-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE_CALENDAR', 'CANVAS', 'MOODLE', 'BLACKBOARD');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'REVOKED', 'NEEDS_REAUTH');

-- CreateEnum
CREATE TYPE "OAuthClientType" AS ENUM ('WEB', 'MOBILE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "verifiedAcademicEmail" TEXT,
ADD COLUMN "academicEmailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "isAcademicEmailPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "externalAccountId" VARCHAR(200),
    "externalAccountEmail" VARCHAR(255),
    "instanceUrl" VARCHAR(500),
    "calendarId" VARCHAR(255),
    "syncCursor" TEXT,
    "syncLockExpiresAt" TIMESTAMP(3),
    "syncLockToken" VARCHAR(100),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT DEFAULT 'SUCCESS',
    "lastError" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_record_mappings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "entityType" TEXT NOT NULL,
    "internalId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "syncHash" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_record_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "clientType" "OAuthClientType" NOT NULL DEFAULT 'WEB',
    "state" TEXT NOT NULL,
    "codeVerifier" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_integrations_userId_provider_key" ON "user_integrations"("userId", "provider");

-- CreateIndex
CREATE INDEX "user_integrations_userId_status_idx" ON "user_integrations"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "external_record_mappings_userId_provider_entityType_externalId_key" ON "external_record_mappings"("userId", "provider", "entityType", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "external_record_mappings_userId_provider_entityType_internalId_key" ON "external_record_mappings"("userId", "provider", "entityType", "internalId");

-- CreateIndex
CREATE INDEX "external_record_mappings_userId_internalId_idx" ON "external_record_mappings"("userId", "internalId");

-- CreateIndex
CREATE INDEX "external_record_mappings_integrationId_idx" ON "external_record_mappings"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_transactions_state_key" ON "oauth_transactions"("state");

-- CreateIndex
CREATE INDEX "oauth_transactions_state_consumedAt_idx" ON "oauth_transactions"("state", "consumedAt");

-- CreateIndex
CREATE INDEX "oauth_transactions_userId_provider_idx" ON "oauth_transactions"("userId", "provider");

-- CreateIndex
CREATE INDEX "email_verification_challenges_userId_email_consumedAt_idx" ON "email_verification_challenges"("userId", "email", "consumedAt");

-- CreateIndex
CREATE INDEX "email_verification_challenges_expiresAt_idx" ON "email_verification_challenges"("expiresAt");

-- AddForeignKey
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_record_mappings" ADD CONSTRAINT "external_record_mappings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_record_mappings" ADD CONSTRAINT "external_record_mappings_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "user_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_transactions" ADD CONSTRAINT "oauth_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_challenges" ADD CONSTRAINT "email_verification_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
