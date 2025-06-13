-- CreateTable
CREATE TABLE "ComplianceScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeName" TEXT NOT NULL,
    "customerText" TEXT NOT NULL,
    "violateText" TEXT,
    "suggestedText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
