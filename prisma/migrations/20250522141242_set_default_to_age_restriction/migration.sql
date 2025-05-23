/*
  Warnings:

  - Made the column `ageRestriction` on table `Post` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "ageRestriction" SET NOT NULL,
ALTER COLUMN "ageRestriction" SET DEFAULT 18;
