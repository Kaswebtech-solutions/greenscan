CREATE TABLE "StorePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeName" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "scanCountResetDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
