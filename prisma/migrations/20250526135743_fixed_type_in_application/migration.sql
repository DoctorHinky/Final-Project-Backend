/*
  Warnings:

  - The `type` column on the `ApplicationDocument` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ApplicationDocType" AS ENUM ('RESUME', 'COVER_LETTER', 'CERTIFICATION', 'OTHER');

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ApplicationDocument" DROP COLUMN "type",
ADD COLUMN     "type" "ApplicationDocType" NOT NULL DEFAULT 'OTHER';

-- DropEnum
DROP TYPE "AppLicationDocType";

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
