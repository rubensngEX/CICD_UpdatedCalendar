/*
  Warnings:

  - You are about to drop the column `team_id` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `team_id` on the `Project` table. All the data in the column will be lost.
  - Added the required column `teamId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Person" DROP CONSTRAINT "Person_team_id_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_team_id_fkey";

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "team_id",
ADD COLUMN     "teamId" INTEGER;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "team_id",
ADD COLUMN     "teamId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
