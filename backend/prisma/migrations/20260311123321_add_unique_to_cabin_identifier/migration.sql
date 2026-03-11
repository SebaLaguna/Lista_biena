/*
  Warnings:

  - A unique constraint covering the columns `[identifier]` on the table `Cabin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Cabin_identifier_key" ON "Cabin"("identifier");
