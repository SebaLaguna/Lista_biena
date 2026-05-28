/*
  Warnings:

  - Added the required column `jerarquia` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Hierarchy" AS ENUM ('ALM', 'CA', 'CN', 'CF', 'CC', 'TN', 'AN', 'AF', 'GM', 'SOC', 'SOP', 'SOS', 'CP', 'CS', 'MP', 'RET');

-- AlterTable
ALTER TABLE "Cabin" ADD COLUMN     "allowed_hierarchies" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "jerarquia" "Hierarchy" NOT NULL;

-- CreateTable
CREATE TABLE "EstivalPeriod" (
    "id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstivalPeriod_pkey" PRIMARY KEY ("id")
);
