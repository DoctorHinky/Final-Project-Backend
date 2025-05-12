-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ApplicationStatus" "ApplicationStatus",
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;
