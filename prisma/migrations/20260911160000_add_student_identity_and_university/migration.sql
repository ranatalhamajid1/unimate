-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "username" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "universityId" TEXT,
ADD COLUMN "campusId" TEXT,
ADD COLUMN "departmentId" TEXT,
ADD COLUMN "degreeProgram" TEXT,
ADD COLUMN "currentSemester" TEXT,
ADD COLUMN "graduationYear" INTEGER,
ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "socialLinks" JSONB,
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isPublicProfile" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "country" TEXT NOT NULL,
    "countryCode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "domain" TEXT,
    "logoUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faculty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_universityId_idx" ON "users"("universityId");

-- CreateIndex
CREATE INDEX "universities_name_idx" ON "universities"("name");

-- CreateIndex
CREATE INDEX "universities_country_idx" ON "universities"("country");

-- CreateIndex
CREATE INDEX "universities_countryCode_idx" ON "universities"("countryCode");

-- CreateIndex
CREATE INDEX "universities_domain_idx" ON "universities"("domain");

-- CreateIndex
CREATE INDEX "campuses_universityId_idx" ON "campuses"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "campuses_universityId_name_key" ON "campuses"("universityId", "name");

-- CreateIndex
CREATE INDEX "departments_universityId_idx" ON "departments"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_universityId_name_key" ON "departments"("universityId", "name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
