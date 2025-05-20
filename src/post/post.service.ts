/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePost, PagePostDto } from './dto';
import { ChapterService } from 'src/chapter/chapter.service';
import { QuizService } from 'src/quiz/quiz.service';
import { calcAge } from 'src/common/helper/dates.helper';
import { UserRoles } from '@prisma/client';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private chapterService: ChapterService,
    private quizService: QuizService,
    private cloudinaryService: CloudinaryService,
  ) {}
  // GET POST

  async getPostPreviews(userId: string, query: PagePostDto) {
    try {
      // eslint-disable-next-line prefer-const
      let { page = 1, limit = 10 } = query;

      const user: { birthdate: Date } | null =
        await this.prisma.user.findUnique({
          where: { id: userId },
          select: { birthdate: true },
        });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      const age = calcAge(user.birthdate);

      const whereClause = {
        OR: [{ published: true }, { published: false, authorId: userId }],
        ageRestriction: { lte: age },
      };

      const totalPosts = await this.prisma.post.count({
        where: whereClause,
      });

      const maxPage = Math.max(1, Math.ceil(totalPosts / limit));
      page = Math.max(1, Math.min(page, maxPage));
      if (page > maxPage && totalPosts > 0) page = maxPage;

      const posts = await this.prisma.post.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        select: {
          title: true,
          id: true,
          quickDescription: true,
          image: true,
          isCertifiedAuthor: true,
          author: {
            select: {
              username: true,
            },
          },
        },
      });

      return {
        meta: {
          currentPage: page,
          totalPages: maxPage,
          totalPosts: totalPosts,
        },
        data: posts.map((post) => {
          return {
            id: post.id,
            title: post.title,
            quickDescription: post.quickDescription,
            image: post.image,
            author: post.author.username,
            isCertifiedAuthor: post.isCertifiedAuthor,
          };
        }),
      };
    } catch (err) {
      throw new BadRequestException('Failed to fetch postpreviews', {
        cause: err,
        description: 'Failed to fetch postpreviews',
      });
    }
  }

  async getPostById(userId: string, role: UserRoles, postId: string) {
    try {
      let whereClause;
      if (role === UserRoles.ADMIN || role === UserRoles.MODERATOR) {
        whereClause = { id: postId };
      } else {
        whereClause = {
          OR: [
            { published: true, id: postId },
            { published: false, authorId: userId, id: postId },
          ],
        };
      }

      console.log('whereClause', whereClause);

      const post = await this.prisma.post.findFirst({
        where: whereClause,
        include: {
          chapters: {
            select: {
              title: true,
              content: true,
              image: true,
            },
          },
          quiz: {
            select: {
              title: true,
              questions: {
                select: {
                  question: true,
                  answers: {
                    select: {
                      answer: true,
                      isCorrect: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!post) throw new BadRequestException('Post not found');

      return {
        message: 'Post found',
        data: post,
      };
    } catch (err) {
      throw new BadRequestException('Post not found', {
        cause: err,
        description: 'Post not found',
      });
    }
  }

  getPostByFilter() {
    // zum beispiel suchen nach einem Namen oder einer Kategorie
    return 'getPostByFilter';
  }

  getPostForUser() {
    // heir sollten alterbeschränkungen vom System verwendet werden, später dann der Algorithmus, welcher Vorschläge macht

    return 'getPostForUser';
  }

  getPostByAuthor() {
    // das sollte sein, wenn man auf dem Profil von einem Autor ist, damit man alles anzeigen kann
    return 'getPostByAuthor';
  }

  // CREATE POST
  async createPost(
    userId: string,
    data: CreatePost,
    files: Express.Multer.File[],
  ) {
    let main;
    let ChImages;
    const mainImage = files.find((f) => f.fieldname === 'image');
    const chapterImages = files.filter((f) =>
      f.fieldname.startsWith('chapterImage_'),
    );
    if (mainImage) {
      main = await this.cloudinaryService.uploadFile(mainImage, 'posts/main');

      if (!main || !main.secure_url) {
        throw new BadRequestException('failted to upload main image');
      }
    }

    if (chapterImages.length > 0) {
      try {
        // wir verwenden hier allSettled, da wir so die Fehler der einzelnen Uploads sehen können
        // und trotzdem alle Uploads machen können
        // wenn wir Promise.all verwenden, wird der erste Fehler geworfen und die anderen Uploads werden nicht gemacht
        const results = await Promise.allSettled(
          chapterImages.map((f) =>
            this.cloudinaryService.uploadFile(f, 'article/chapter'),
          ),
        );

        ChImages = results.map((r, i) => {
          if (r.status === 'fulfilled') return r.value;
          console.error(`upload failed for chapter ${i}`, r.reason);
          return null;
        });
      } catch (error) {
        throw new Error('Failed to upload chapter images', {
          cause: error,
        });
      }
    }

    const certificated: { isPedagogicalAuthor: boolean } | null =
      await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isPedagogicalAuthor: true },
      });

    if (!certificated || certificated.isPedagogicalAuthor === undefined) {
      console.log('certificated', certificated);
      throw new BadRequestException('User not found');
    }

    const updatedDTO: CreatePost = {
      ...data,
      image: main.secure_url,
      publicId_image: main.public_id,
      chapters: data.chapters.map((chapter, i) => ({
        ...chapter,
        image: ChImages[i]?.secure_url ?? null,
        publicId_image: ChImages[i]?.public_id ?? null,
      })),
    };

    return this.prisma.$transaction(async (tx) => {
      const newPost = await this.prisma.post.create({
        data: {
          title: updatedDTO.title,
          quickDescription: updatedDTO.quickDescription,
          image: updatedDTO.image ?? null,
          publicId_image: updatedDTO.publicId_image ?? null,
          tags: updatedDTO.tags,
          ageRestriction: updatedDTO.ageRestriction,
          authorId: userId,
          published: updatedDTO.isPublished,
          publishedAt: updatedDTO.isPublished ? new Date() : null,
          publishedBy: updatedDTO.isPublished ? userId : null,
          isCertifiedAuthor: certificated?.isPedagogicalAuthor ?? false,
        },
      });

      // dann werden hier die Kapitel hinzugefügt:

      if (!data.chapters || data.chapters.length === 0) {
        throw new ForbiddenException('Chapters are required, but not provided');
      }

      await this.chapterService.addChapterToPost(
        newPost.id,
        updatedDTO.chapters,
        tx,
      );

      if (data.quiz) {
        await this.quizService.createQuiz(newPost.id, updatedDTO.quiz, tx);
      }
      return { message: 'Post created', postId: newPost.id };
    });
  }

  // UPDATE POST
  updatePost() {
    // hier wird der Post aktualisiert
    // diese Funktion kann die anderen verwenden um den Post zu aktualisieren
    return 'updatePost';
  }

  addChapter() {
    // hier wird ein Kapitel hinzugefügt
    return 'addChapter';
  }
  addQuiz() {
    // hier wird ein Quiz hinzugefügt
    return 'addQuiz';
  }
  addImage() {
    // hier wird ein Bild hinzugefügt
    return 'addImage';
  }

  publishPost() {
    // hier wird der Post auf öffentlich gesetzt
    return 'publishPost';
  }
  unpublishPost() {
    // hier wird der Post auf privat gesetzt
    return 'unpublishPost';
  }

  // DELETE POST

  deletePost() {
    // hier wird der Post gelöscht (soft delete)
    return 'deletePost';
  }

  restorePost() {
    // hier wird der Post wiederhergestellt
    return 'restorePost';
  }

  removePost() {
    // hier wird der Post entfernt
    return 'removePost';
  }
}
