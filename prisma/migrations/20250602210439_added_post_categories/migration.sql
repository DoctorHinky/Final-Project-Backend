-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('EDUCATION', 'ENTERTAINMENT', 'TECHNOLOGY', 'HEALTH', 'LIFESTYLE', 'TRAVEL', 'FOOD', 'SPORTS', 'OTHER');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "category" "PostCategory" NOT NULL DEFAULT 'OTHER';
