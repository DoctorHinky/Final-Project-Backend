/*
  Warnings:

  - You are about to drop the column `moderatorId` on the `Comment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_moderatorId_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "moderatorId";
