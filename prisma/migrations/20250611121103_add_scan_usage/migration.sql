-- CreateTable
CREATE TABLE "ScanUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "store" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "ScanUsage_store_month_key" ON "ScanUsage"("store", "month");
