-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StorePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeName" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "scanCountResetDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StorePlan" ("createdAt", "id", "planName", "storeName", "updatedAt") SELECT "createdAt", "id", "planName", "storeName", "updatedAt" FROM "StorePlan";
DROP TABLE "StorePlan";
ALTER TABLE "new_StorePlan" RENAME TO "StorePlan";
CREATE UNIQUE INDEX "StorePlan_storeName_key" ON "StorePlan"("storeName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
