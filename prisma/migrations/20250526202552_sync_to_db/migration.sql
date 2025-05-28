-- DropForeignKey
ALTER TABLE "ApplicationDocument" DROP CONSTRAINT "ApplicationDocument_applicationId_fkey";

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
