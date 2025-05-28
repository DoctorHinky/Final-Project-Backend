-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "parentId" UUID;

-- CreateTable
CREATE TABLE "CommentRating" (
    "commentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "CommentRating_pkey" PRIMARY KEY ("commentId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentRating_commentId_userId_key" ON "CommentRating"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentRating" ADD CONSTRAINT "CommentRating_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentRating" ADD CONSTRAINT "CommentRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
