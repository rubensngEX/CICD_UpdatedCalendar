/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Person` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Task_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");
