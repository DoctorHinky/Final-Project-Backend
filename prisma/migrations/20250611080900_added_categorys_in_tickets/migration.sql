-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('WEBSITE_BUG', 'REPORT', 'ACCOUNT', 'TECHNICAL', 'OTHER');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "category" "TicketCategory" NOT NULL DEFAULT 'OTHER';
