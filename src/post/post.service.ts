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

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private chapterService: ChapterService,
    private quizService: QuizService,
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
      console.log('age', age);

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
  async createPost(userId: string, data: CreatePost) {
    const certificated: { isPedagogicalAuthor: boolean } | null =
      await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isPedagogicalAuthor: true },
      });

    if (!certificated || certificated.isPedagogicalAuthor === undefined) {
      console.log('certificated', certificated);
      throw new BadRequestException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const newPost = await this.prisma.post.create({
        data: {
          title: data.title,
          quickDescription: data.quickDescription,
          image: data.image,
          publicId_image: data.publicId_image,
          tags: data.tags,
          ageRestriction: data.ageRestriction,
          authorId: userId,
          published: data.isPublished,
          isCertifiedAuthor: certificated?.isPedagogicalAuthor ?? false,
        },
      });

      // dann werden hier die Kapitel hinzugefügt:

      if (!data.chapters || data.chapters.length === 0) {
        throw new ForbiddenException('Chapters are required, but not provided');
      }

      await this.chapterService.addChapterToPost(newPost.id, data.chapters, tx);

      if (data.quiz) {
        await this.quizService.createQuiz(newPost.id, data.quiz, tx);
      }
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
