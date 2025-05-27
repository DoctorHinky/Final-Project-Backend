/*
  Warnings:

  - You are about to drop the `ReadPost` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReadPost" DROP CONSTRAINT "ReadPost_postId_fkey";

-- DropForeignKey
ALTER TABLE "ReadPost" DROP CONSTRAINT "ReadPost_userId_fkey";

-- DropTable
DROP TABLE "ReadPost";

-- CreateTable
CREATE TABLE "History" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizId" UUID,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solvedQuiz" BOOLEAN,
    "quizScore" INTEGER,
    "solvedAt" TIMESTAMP(3),

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "History_userId_postId_key" ON "History"("userId", "postId");

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
