-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "forKids" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "ageRestriction" DROP NOT NULL;
