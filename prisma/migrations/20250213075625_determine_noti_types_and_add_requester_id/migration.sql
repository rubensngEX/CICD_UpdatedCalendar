/*
  Warnings:

  - The values [NOTIFICATION] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `title` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ANNOUNCEMENT', 'REQUEST', 'UPDATE');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "title",
ADD COLUMN     "requesterId" INTEGER;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
