-- CreateEnum
CREATE TYPE "Mando" AS ENUM ('COMFLO', 'DIMAT', 'PRENA');

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_cabin_id_fkey";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "mando" "Mando";

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "application_group" TEXT,
ADD COLUMN     "location_id" TEXT,
ADD COLUMN     "priority" INTEGER,
ALTER COLUMN "cabin_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_cabin_id_fkey" FOREIGN KEY ("cabin_id") REFERENCES "Cabin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
