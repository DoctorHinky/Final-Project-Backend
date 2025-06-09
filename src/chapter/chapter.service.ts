import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { BasePrismaService } from 'src/common/utilitys/base-prisma.service';
import { ChapterDto, UpdateChapterDto } from 'src/post/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChapterService extends BasePrismaService {
  constructor(
    prisma: PrismaService,
    private CloudinaryService: CloudinaryService,
  ) {
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

  async addNewChapter(postId: string, data: ChapterDto) {
    const prisma = this.getPrisma();

    return await prisma.chapter.create({
      data: {
        ...data,
        postId: postId,
      },
    });
  }

  async updateChapter(
    chapterId: string,
    data: UpdateChapterDto,
    file?: Express.Multer.File,
  ) {
    const prisma = this.getPrisma();
    try {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }
      if (file) {
        const image = await this.CloudinaryService.uploadFile(file);
        if (chapter.publicId_image) {
          await this.CloudinaryService.deleteFile(chapter.publicId_image);
        }
        data.image = image.secure_url;
        data.publicId_image = image.public_id;
      }

      const updatedChapter = await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          ...data,
          image: data.image,
          publicId_image: data.publicId_image,
        },
      });
      return updatedChapter;
    } catch (err) {
      throw new NotFoundException('Chapter not found', {
        cause: err,
        description: 'Chapter not found',
      });
    }
  }

  async addImage(
    chapterId: string,
    file: Express.Multer.File,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = this.getPrisma(tx);
    const image = await this.CloudinaryService.uploadFile(file);

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        image: image.secure_url,
        publicId_image: image.public_id,
      },
    });
    return { data: updatedChapter.image };
  }

  async removeImage(chapterId: string, tx?: Prisma.TransactionClient) {
    const prisma = this.getPrisma(tx);
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (chapter.publicId_image) {
      await this.CloudinaryService.deleteFile(chapter.publicId_image);
    }

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        image: null,
        publicId_image: null,
      },
    });
    return updatedChapter;
  }
  async deleteChapter(chapterId: string, tx?: Prisma.TransactionClient) {
    const prisma = this.getPrisma(tx);

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) throw new NotFoundException('Chapter not found');

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        isDeleted: true,
      },
    });
    return 'deleteChapter';
  }

  async restoreChapter(chapterId: string, tx?: Prisma.TransactionClient) {
    const prisma = this.getPrisma(tx);

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) throw new NotFoundException('Chapter not found');

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        isDeleted: false,
      },
    });
    return 'restoreChapter';
  }
}
