-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "targetType" TEXT,
ADD COLUMN "targetId" TEXT,
ADD COLUMN "plannedDuration" INTEGER,
ADD COLUMN "pausedAt" TIMESTAMP(3),
ADD COLUMN "totalPausedSeconds" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "study_sessions_userId_status_idx" ON "study_sessions"("userId", "status");

-- CreateUniqueIndex for single active session per user
CREATE UNIQUE INDEX "idx_single_active_focus_session" ON "study_sessions"("userId") WHERE "status" IN ('ACTIVE', 'PAUSED');
