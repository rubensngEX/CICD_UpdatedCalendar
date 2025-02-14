/*
  Warnings:

  - A unique constraint covering the columns `[teamCode]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `teamCode` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "teamCode" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Person_googleId_idx" ON "Person"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamCode_key" ON "Team"("teamCode");
