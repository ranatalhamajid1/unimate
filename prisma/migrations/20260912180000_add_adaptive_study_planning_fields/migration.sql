-- AlterTable
ALTER TABLE "study_plan_items" ADD COLUMN "targetType" TEXT,
ADD COLUMN "targetId" TEXT;

-- CreateIndex
CREATE INDEX "study_plan_items_targetType_targetId_idx" ON "study_plan_items"("targetType", "targetId");
CREATE INDEX "study_plans_userId_status_idx" ON "study_plans"("userId", "status");

-- CreateUniqueIndex for single active study plan per user
CREATE UNIQUE INDEX "idx_unique_active_study_plan_per_user" ON "study_plans"("userId") WHERE "status" = 'ACTIVE';
