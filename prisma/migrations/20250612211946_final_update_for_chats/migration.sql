/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `DirectMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "isDeleted",
ADD COLUMN     "isDeletedBy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeletedBySender" BOOLEAN NOT NULL DEFAULT false;
