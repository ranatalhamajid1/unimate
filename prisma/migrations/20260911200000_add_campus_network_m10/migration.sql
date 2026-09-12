-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendeeStatus" AS ENUM ('GOING', 'MAYBE', 'NOT_GOING');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('LINK', 'NOTE');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('COMMUNITY', 'MEMBER', 'EVENT', 'ANNOUNCEMENT', 'RESOURCE');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'IMPERSONATION', 'INAPPROPRIATE_CONTENT', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "community_announcements" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_events" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(200),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "meetingUrl" VARCHAR(500),
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Karachi',
    "capacity" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_event_attendees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendeeStatus" NOT NULL DEFAULT 'GOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_resources" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "type" "ResourceType" NOT NULL DEFAULT 'LINK',
    "url" VARCHAR(1000) NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_reports" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" VARCHAR(100) NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionNotes" VARCHAR(1000),
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_announcements_communityId_isPinned_createdAt_idx" ON "community_announcements"("communityId", "isPinned", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "community_announcements_communityId_createdAt_idx" ON "community_announcements"("communityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "community_events_communityId_startAt_idx" ON "community_events"("communityId", "startAt" ASC);

-- CreateIndex
CREATE INDEX "community_events_communityId_status_startAt_idx" ON "community_events"("communityId", "status", "startAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "community_event_attendees_eventId_userId_key" ON "community_event_attendees"("eventId", "userId");

-- CreateIndex
CREATE INDEX "community_event_attendees_userId_status_idx" ON "community_event_attendees"("userId", "status");

-- CreateIndex
CREATE INDEX "community_event_attendees_eventId_status_idx" ON "community_event_attendees"("eventId", "status");

-- CreateIndex
CREATE INDEX "community_resources_communityId_type_createdAt_idx" ON "community_resources"("communityId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "community_reports_communityId_status_createdAt_idx" ON "community_reports"("communityId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "community_reports_reporterUserId_targetType_targetId_status_idx" ON "community_reports"("reporterUserId", "targetType", "targetId", "status");

-- CreateIndex
CREATE INDEX "community_reports_communityId_targetType_targetId_idx" ON "community_reports"("communityId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "community_announcements" ADD CONSTRAINT "community_announcements_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_announcements" ADD CONSTRAINT "community_announcements_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_announcements" ADD CONSTRAINT "community_announcements_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_event_attendees" ADD CONSTRAINT "community_event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "community_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_event_attendees" ADD CONSTRAINT "community_event_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_resources" ADD CONSTRAINT "community_resources_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_resources" ADD CONSTRAINT "community_resources_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports" ADD CONSTRAINT "community_reports_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
