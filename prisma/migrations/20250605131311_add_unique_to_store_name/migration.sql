/*
  Warnings:

  - A unique constraint covering the columns `[storeName]` on the table `StorePlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StorePlan_storeName_key" ON "StorePlan"("storeName");
