/*
  Warnings:

  - The values [SPORTS] on the enum `PostCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PostCategory_new" AS ENUM ('ENTERTAINMENT', 'EDUCATION', 'RAISING_CHILDREN', 'FAMILY', 'CULTURE', 'NATURE', 'TECHNOLOGY', 'HEALTH', 'LIFESTYLE', 'TRAVEL', 'FOOD', 'FITNESS', 'OTHER');
ALTER TABLE "Post" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "Post" ALTER COLUMN "category" TYPE "PostCategory_new" USING ("category"::text::"PostCategory_new");
ALTER TYPE "PostCategory" RENAME TO "PostCategory_old";
ALTER TYPE "PostCategory_new" RENAME TO "PostCategory";
DROP TYPE "PostCategory_old";
ALTER TABLE "Post" ALTER COLUMN "category" SET DEFAULT 'OTHER';
COMMIT;
