/*
  Warnings:

  - You are about to drop the column `capital` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `nextCapitalId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `preCapitalId` on the `Post` table. All the data in the column will be lost.
  - Added the required column `quickDescription` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_nextCapitalId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_preCapitalId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "capital",
DROP COLUMN "content",
DROP COLUMN "nextCapitalId",
DROP COLUMN "preCapitalId",
ADD COLUMN     "publicId_image" TEXT,
ADD COLUMN     "quickDescription" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Chapter" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "publicId_image" TEXT,
    "order" INTEGER NOT NULL,
    "postId" UUID NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_postId_key" ON "Quiz"("postId");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
