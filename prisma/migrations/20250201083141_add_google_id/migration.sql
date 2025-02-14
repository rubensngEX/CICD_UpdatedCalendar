/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `Person` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Person_googleId_key" ON "Person"("googleId");
