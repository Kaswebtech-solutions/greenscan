/*
  Warnings:

  - You are about to drop the column `scanCountResetDate` on the `StorePlan` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StorePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeName" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "lastReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerText" TEXT,
    "violateText" TEXT,
    "suggestedText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StorePlan" ("createdAt", "id", "planName", "scanCount", "storeName", "updatedAt") SELECT "createdAt", "id", "planName", "scanCount", "storeName", "updatedAt" FROM "StorePlan";
DROP TABLE "StorePlan";
ALTER TABLE "new_StorePlan" RENAME TO "StorePlan";
CREATE UNIQUE INDEX "StorePlan_storeName_key" ON "StorePlan"("storeName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
