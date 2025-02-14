-- CreateTable
CREATE TABLE "ProjectRequest" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "approve" BOOLEAN,

    CONSTRAINT "ProjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequest_personId_projectId_key" ON "ProjectRequest"("personId", "projectId");

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
