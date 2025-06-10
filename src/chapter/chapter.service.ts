import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    try {
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
    } catch (error) {
      console.error('Error adding chapters to post:', error);
      throw new BadRequestException('Post not found', {
        cause: error,
        description: 'Post not found',
      });
    }
  }

  async addNewChapter(postId: string, data: ChapterDto) {
    const prisma = this.getPrisma();

    try {
      return await prisma.chapter.create({
        data: {
          ...data,
          postId: postId,
        },
      });
    } catch (error) {
      console.error('Error adding new chapter:', error);
      throw new BadRequestException('Post not found', {
        cause: error,
        description: 'Post not found',
      });
    }
  }

  async updateChapter(chapterId: string, data: UpdateChapterDto) {
    const prisma = this.getPrisma();
    try {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      const updatedChapter = await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          title: data.title,
          content: data.content,
        },
      });
      return updatedChapter;
    } catch (err) {
      console.error('Error updating chapter:', err);
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
    try {
      const prisma = this.getPrisma(tx);
      const image = await this.CloudinaryService.uploadFile(
        file,
        'posts/chapter',
      );

      const updatedChapter = await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          image: image.secure_url,
          publicId_image: image.public_id,
        },
      });
      return { data: updatedChapter.image };
    } catch (error) {
      console.error('Error adding image to chapter:', error);
      throw new BadRequestException('Failed to add image to chapter', {
        cause: error,
        description: 'Failed to add image to chapter',
      });
    }
  }

  async removeImage(chapterId: string, tx?: Prisma.TransactionClient) {
    try {
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
    } catch (error) {
      console.error('Error removing image from chapter:', error);
      throw new BadRequestException('Failed to remove image from chapter', {
        cause: error,
        description: 'Failed to remove image from chapter',
      });
    }
  }

  async deleteChapter(chapterId: string, tx?: Prisma.TransactionClient) {
    try {
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
    } catch (error) {
      console.error('Error deleting chapter:', error);
      throw new NotFoundException('Chapter not found', {
        cause: error,
        description: 'Chapter not found',
      });
    }
  }

  async restoreChapter(chapterId: string, tx?: Prisma.TransactionClient) {
    try {
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
    } catch (error) {
      console.error('Error restoring chapter:', error);
      throw new NotFoundException('Chapter not found', {
        cause: error,
        description: 'Chapter not found',
      });
    }
  }
}
