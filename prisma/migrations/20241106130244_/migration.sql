/*
  Warnings:

  - You are about to drop the `ProjectPersonRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectPersonRole" DROP CONSTRAINT "ProjectPersonRole_personId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectPersonRole" DROP CONSTRAINT "ProjectPersonRole_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectPersonRole" DROP CONSTRAINT "ProjectPersonRole_roleId_fkey";

-- DropTable
DROP TABLE "ProjectPersonRole";

-- CreateTable
CREATE TABLE "ProjectPerson" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,

    CONSTRAINT "ProjectPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectPerson_projectId_idx" ON "ProjectPerson"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPerson_projectId_personId_key" ON "ProjectPerson"("projectId", "personId");

-- AddForeignKey
ALTER TABLE "ProjectPerson" ADD CONSTRAINT "ProjectPerson_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPerson" ADD CONSTRAINT "ProjectPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
