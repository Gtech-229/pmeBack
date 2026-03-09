-- CreateTable
CREATE TABLE "GeneralParams" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'Suivi-MP',
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "primaryColor" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralParams_pkey" PRIMARY KEY ("id")
);
