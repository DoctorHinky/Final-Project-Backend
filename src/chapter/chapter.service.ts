import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BasePrismaService } from 'src/common/utilitys/base-prisma.service';
import { ChapterDto } from 'src/post/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChapterService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async addChapterToPost(
    postId: string,
    data: ChapterDto[],
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = this.getPrisma(tx);

    await Promise.all(
      data.map((chapter) => {
        return prisma.chapter.create({
          data: {
            ...chapter,
            postId: postId,
          },
        });
      }),
    );
  }
}
/* updateChapter() {
  // per Id sollte dann hier der Inhalt aktualisiert werden
  return 'updateChapter';
}

deleteChapter() {
  // per Id sollte dann hier der Inhalt gelöscht werden
  return 'deleteChapter';
}

// es wird keine restore Funktion geben da ich nur den Softdelete mache damit man nichts illegales löschen kann

removeChapterFromPost() {
  // per Id sollte dann hier der Inhalt gelöscht werden
  return 'removeChapterFromPost';
} */
