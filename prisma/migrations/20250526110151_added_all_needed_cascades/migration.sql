/*
  Warnings:

  - The `type` column on the `ApplicationDocument` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AppLicationDocType" AS ENUM ('RESUME', 'COVER_LETTER', 'CERTIFICATION', 'OTHER');

-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_initiatorId_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "ReadPost" DROP CONSTRAINT "ReadPost_postId_fkey";

-- DropForeignKey
ALTER TABLE "ReadPost" DROP CONSTRAINT "ReadPost_userId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_userFileId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_userFileId_fkey";

-- AlterTable
ALTER TABLE "ApplicationDocument" DROP COLUMN "type",
ADD COLUMN     "type" "AppLicationDocType" NOT NULL DEFAULT 'OTHER';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userFileId_fkey" FOREIGN KEY ("userFileId") REFERENCES "UserFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userFileId_fkey" FOREIGN KEY ("userFileId") REFERENCES "UserFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadPost" ADD CONSTRAINT "ReadPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadPost" ADD CONSTRAINT "ReadPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
