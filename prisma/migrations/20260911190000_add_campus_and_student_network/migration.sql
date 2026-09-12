-- CreateEnum
CREATE TYPE "CommunityType" AS ENUM ('ACADEMIC', 'STUDY_GROUP', 'CLUB', 'SOCIETY', 'SPORTS', 'TECH', 'CAREER', 'CULTURAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunityScope" AS ENUM ('UNIVERSITY', 'CAMPUS', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "CommunityVisibility" AS ENUM ('PUBLIC', 'CAMPUS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "CommunityModerationStatus" AS ENUM ('APPROVED', 'PENDING_REVIEW', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'BANNED');

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "type" "CommunityType" NOT NULL DEFAULT 'ACADEMIC',
    "scope" "CommunityScope" NOT NULL DEFAULT 'UNIVERSITY',
    "visibility" "CommunityVisibility" NOT NULL DEFAULT 'PUBLIC',
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "departmentId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "CommunityModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdByUserId" TEXT,
    "courseCode" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 500,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");

-- CreateIndex
CREATE INDEX "communities_universityId_idx" ON "communities"("universityId");

-- CreateIndex
CREATE INDEX "communities_campusId_idx" ON "communities"("campusId");

-- CreateIndex
CREATE INDEX "communities_departmentId_idx" ON "communities"("departmentId");

-- CreateIndex
CREATE INDEX "communities_type_idx" ON "communities"("type");

-- CreateIndex
CREATE INDEX "communities_scope_idx" ON "communities"("scope");

-- CreateIndex
CREATE INDEX "communities_visibility_idx" ON "communities"("visibility");

-- CreateIndex
CREATE INDEX "communities_isVerified_idx" ON "communities"("isVerified");

-- CreateIndex
CREATE INDEX "communities_moderationStatus_idx" ON "communities"("moderationStatus");

-- CreateIndex
CREATE INDEX "communities_createdByUserId_idx" ON "communities"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_communityId_userId_key" ON "community_members"("communityId", "userId");

-- CreateIndex
CREATE INDEX "community_members_communityId_idx" ON "community_members"("communityId");

-- CreateIndex
CREATE INDEX "community_members_userId_idx" ON "community_members"("userId");

-- CreateIndex
CREATE INDEX "community_members_role_idx" ON "community_members"("role");

-- CreateIndex
CREATE INDEX "community_members_status_idx" ON "community_members"("status");

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
