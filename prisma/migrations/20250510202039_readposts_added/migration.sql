-- CreateTable
CREATE TABLE "ReadPost" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadPost_userId_postId_key" ON "ReadPost"("userId", "postId");

-- AddForeignKey
ALTER TABLE "ReadPost" ADD CONSTRAINT "ReadPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadPost" ADD CONSTRAINT "ReadPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
