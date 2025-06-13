/*
  Warnings:

  - You are about to drop the column `isDeletedBy` on the `DirectMessage` table. All the data in the column will be lost.
  - You are about to drop the column `isDeletedBySender` on the `DirectMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "isDeletedBy",
DROP COLUMN "isDeletedBySender",
ADD COLUMN     "isDeletedForReceiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeletedForSender" BOOLEAN NOT NULL DEFAULT false;
