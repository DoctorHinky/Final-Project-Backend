/*
  Warnings:

  - You are about to drop the column `Dislikes` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `Likes` on the `Rating` table. All the data in the column will be lost.
  - Added the required column `value` to the `Rating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "Dislikes",
DROP COLUMN "Likes",
ADD COLUMN     "value" INTEGER NOT NULL;
