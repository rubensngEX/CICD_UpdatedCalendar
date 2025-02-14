/*
  Warnings:

  - You are about to drop the column `statusId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `Status` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `status` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_statusId_fkey";

-- DropIndex
DROP INDEX "Task_statusId_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "statusId",
ADD COLUMN     "status" "TaskStatus" NOT NULL;

-- DropTable
DROP TABLE "Status";
