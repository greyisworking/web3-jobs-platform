-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "raw_description" TEXT,
    "url" TEXT NOT NULL,
    "salary" TEXT,
    "tags" TEXT,
    "source" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "postedDate" TIMESTAMP(3),
    "crawledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastValidated" TIMESTAMP(3),
    "requirements" TEXT,
    "responsibilities" TEXT,
    "benefits" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT,
    "deadline" TIMESTAMP(3),
    "experienceLevel" TEXT,
    "remoteType" TEXT,
    "companyLogo" TEXT,
    "companyWebsite" TEXT,
    "backers" TEXT[],
    "badges" TEXT[],
    "sector" TEXT,
    "office_location" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "postedBy" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobReport" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "jobId" TEXT NOT NULL,
    "reporterWallet" TEXT,
    "reporterIp" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletBlacklist" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "wallet" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "jobCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrawlLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_url_key" ON "Job"("url");

-- CreateIndex
CREATE INDEX "Job_company_idx" ON "Job"("company");

-- CreateIndex
CREATE INDEX "Job_source_idx" ON "Job"("source");

-- CreateIndex
CREATE INDEX "Job_region_idx" ON "Job"("region");

-- CreateIndex
CREATE INDEX "Job_isActive_idx" ON "Job"("isActive");

-- CreateIndex
CREATE INDEX "Job_postedDate_idx" ON "Job"("postedDate");

-- CreateIndex
CREATE INDEX "Job_postedBy_idx" ON "Job"("postedBy");

-- CreateIndex
CREATE INDEX "Job_experienceLevel_idx" ON "Job"("experienceLevel");

-- CreateIndex
CREATE INDEX "Job_role_idx" ON "Job"("role");

-- CreateIndex
CREATE INDEX "JobReport_jobId_idx" ON "JobReport"("jobId");

-- CreateIndex
CREATE INDEX "JobReport_reporterWallet_idx" ON "JobReport"("reporterWallet");

-- CreateIndex
CREATE INDEX "JobReport_createdAt_idx" ON "JobReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalletBlacklist_wallet_key" ON "WalletBlacklist"("wallet");

-- CreateIndex
CREATE INDEX "WalletBlacklist_wallet_idx" ON "WalletBlacklist"("wallet");

-- CreateIndex
CREATE INDEX "CrawlLog_source_idx" ON "CrawlLog"("source");

-- CreateIndex
CREATE INDEX "CrawlLog_createdAt_idx" ON "CrawlLog"("createdAt");

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
