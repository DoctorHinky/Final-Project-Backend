/*
  Warnings:

  - You are about to drop the column `publishedBy` on the `Post` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_publishedBy_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "publishedBy";
