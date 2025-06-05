/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ChapterDto,
  CreatePost,
  CreateQuizDto,
  PagePostDto,
  QuizAnswerDto,
  QuizQuestionDto,
  UpdateChapterDto,
  UpdateMainPostDataDto,
} from './dto';
import { ChapterService } from 'src/chapter/chapter.service';
import { QuizService } from 'src/quiz/quiz.service';
import { calcAge } from 'src/common/helper/dates.helper';
import { Post, PostCategory, Prisma, UserRoles } from '@prisma/client';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { DeleteReasonDto } from './dto/delete-reason.dto';
import { UploadApiResponse } from 'cloudinary';

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

      const whereClause: Prisma.PostWhereInput = {
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
            author: post.author?.username,
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
          author: {
            select: {
              username: true,
            },
          },
          chapters: {
            select: {
              id: true,
              title: true,
              content: true,
              image: true,
            },
          },
          quiz: {
            select: {
              id: true,
              questions: {
                select: {
                  id: true,
                  question: true,
                  answers: {
                    select: {
                      id: true,
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
    // wir erstellen die Filter logik wenn wir alles erstellt haben was wir wie ratings oder comments
    return 'getPostByFilter';
  }

  async getPostForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('no user founded');

    let query: Prisma.PostWhereInput = { published: true };

    const userAge = calcAge(user.birthdate);

    if (userAge < 18) {
      query = {
        ...query,
        ageRestriction: { lte: userAge },
      };
    }

    const posts = await this.prisma.post.findMany({
      where: query,
      include: {
        chapters: true,
        quiz: true,
      },
    });

    // hier sollte dann noch der Readfilter ausgelesen werden

    return {
      message: 'Posts found',
      data: posts,
    };
  }

  async getPostByAuthor(role: UserRoles, authorId: string) {
    try {
      let posts: Post[] | null = null;
      if (role === UserRoles.ADMIN || role === UserRoles.MODERATOR) {
        posts = await this.prisma.post.findMany({
          where: { authorId },
          include: {
            chapters: true,
            quiz: true,
          },
        });
      } else {
        posts = await this.prisma.post.findMany({
          where: { authorId, published: true },
          include: {
            chapters: true,
            quiz: true,
          },
        });
      }

      if (!posts || posts.length === 0) {
        throw new NotFoundException('Internal error: No posts found');
      }

      return {
        message: 'Posts found',
        data: posts,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch posts by author', {
        cause: error,
        description: 'Failed to fetch posts by author',
      });
    }
  }

  // CREATE POST
  async createPost(
    userId: string,
    data: CreatePost,
    files: Express.Multer.File[],
  ) {
    let main: UploadApiResponse | null = null;
    let ChImages: (UploadApiResponse | null)[] = [];

    const mainImage = files.find((f) => f.fieldname === 'image');
    const chapterImages = files.filter((f) =>
      f.fieldname.startsWith('chapterImage_'),
    );
    if (mainImage) {
      main = await this.cloudinaryService.uploadFile(mainImage, 'posts/main');

      if (!main?.secure_url) {
        throw new BadRequestException('failed to upload main image');
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
    } else {
      ChImages = [];
    }

    const certificated = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPedagogicalAuthor: true },
    });

    if (!certificated) {
      throw new BadRequestException('User not found');
    }

    // fro kids normaliesieren
    let kidsflag: boolean;

    if (typeof data.forKids === 'boolean') {
      kidsflag = data.forKids;
    } else if (typeof data.forKids === 'string') {
      if (data.forKids === 'true') {
        kidsflag = true;
      } else if (data.forKids === 'false') {
        kidsflag = false;
      } else {
        throw new BadRequestException(
          'invalid value for forKids, has to be true or false',
        );
      }
    } else {
      kidsflag = false;
    }

    if (kidsflag === true && !data.ageRestriction) {
      throw new BadRequestException(
        'To mark this post as kid-friendly, you must provide ageRestriction',
      );
    }

    let category: PostCategory;
    switch (data.category?.toUpperCase()) {
      case 'EDUCATION':
        category = PostCategory.EDUCATION;
        break;

      case 'ENTERTAINMENT':
        category = PostCategory.ENTERTAINMENT;
        break;

      case 'FAMILY':
        category = PostCategory.FAMILY;
        break;

      case 'CULTURE':
        category = PostCategory.CULTURE;
        break;

      case 'NATURE':
        category = PostCategory.NATURE;
        break;

      case 'RAISING_CHILDREN':
        category = PostCategory.RAISING_CHILDREN;
        break;

      case 'TECHNOLOGY':
        category = PostCategory.TECHNOLOGY;
        break;

      case 'HEALTH':
        category = PostCategory.HEALTH;
        break;

      case 'LIFESTYLE':
        category = PostCategory.LIFESTYLE;
        break;

      case 'TRAVEL':
        category = PostCategory.TRAVEL;
        break;

      case 'FOOD':
        category = PostCategory.FOOD;
        break;

      case 'FITNESS':
        category = PostCategory.FITNESS;
        break;
      case 'OTHER':
        category = PostCategory.OTHER;
        break;
      default:
        // wenn die Kategorie nicht in der Liste ist, dann wird sie als OTHER gespeichert
        category = PostCategory.OTHER;
        break;
    }
    const getBooleanValue = (value: any): boolean => {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return false; // Default to false if not a boolean or string
    };

    const updatedDTO: CreatePost = {
      ...data,
      image: main?.secure_url ?? null,
      publicId_image: main?.public_id ?? null,
      forKids: kidsflag,
      category: category,
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
          published: getBooleanValue(updatedDTO.published),
          publishedAt: updatedDTO.publishedAt ?? null,
          forKids: updatedDTO.forKids,
          ageRestriction: updatedDTO.ageRestriction,
          authorId: userId,
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

      if (data.quiz && Object.keys(data.quiz).length > 0) {
        await this.quizService.createQuiz(newPost.id, updatedDTO.quiz, tx);
      }
      console.log('newPost', newPost);
      return { message: 'Post created', postId: newPost.id, success: true };
    });
  }

  // UPDATE POST
  async updatePost(
    user: { id: string; roles: UserRoles },
    postId: string,
    data: UpdateMainPostDataDto,
    file?: Express.Multer.File,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        publicId_image: true,
        authorId: true,
        published: true,
        forKids: true,
        ageRestriction: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (file) {
      if (post && post.publicId_image) {
        await this.cloudinaryService.deleteFile(post.publicId_image);
      }

      const image = await this.cloudinaryService.uploadFile(file, 'posts/main');

      if (!image || !image.secure_url) {
        throw new BadRequestException('Failed to upload image');
      }

      data.image = image.secure_url;
      data.publicId_image = image.public_id;
    }
    let updateData: any = { ...data };

    let forKidsFlag: boolean | undefined;

    if (typeof data.forKids === 'string') {
      if (data.forKids === 'true') {
        forKidsFlag = true;
      } else if (data.forKids === 'false') {
        forKidsFlag = false;
      } else {
        throw new BadRequestException(
          'invalid value for forKids, has to be true or false',
        );
      }
    } else if (typeof data.forKids === 'boolean') {
      forKidsFlag = data.forKids;
    }
    // Validierung bei Kind-Beiträgen
    if (forKidsFlag === true) {
      const ageRestriction = data.ageRestriction ?? post.ageRestriction;

      if (ageRestriction === undefined || ageRestriction === null) {
        throw new BadRequestException(
          'To mark this post as kid-friendly, you must provide ageRestriction',
        );
      }

      if (ageRestriction < 0 || ageRestriction > 18) {
        throw new BadRequestException(
          'ageRestriction must be between 0 and 18 for kid posts',
        );
      }
    }

    // merge final in updateData
    if (forKidsFlag !== undefined) updateData.forKids = forKidsFlag;

    if (post.authorId !== user.id) {
      if (
        user.roles !== UserRoles.ADMIN &&
        user.roles !== UserRoles.MODERATOR
      ) {
        throw new ForbiddenException('You are not the author of this post');
      }
      updateData = {
        ...data,
        published: false,
        publishedAt: null,
        moderatorId: user.id,
      };

      // hier sollte noch die mail an den author geschickt werden, dass der post vom moderator bearbeitet wurde
    } else {
      updateData = { ...data };
    }

    if (updateData.category) {
      let enumCategory: PostCategory;
      switch (updateData.category) {
        case 'EDUCATION':
          enumCategory = PostCategory.EDUCATION;
          break;
        case 'ENTERTAINMENT':
          enumCategory = PostCategory.ENTERTAINMENT;
          break;
        case 'TECHNOLOGY':
          enumCategory = PostCategory.TECHNOLOGY;
          break;
        case 'HEALTH':
          enumCategory = PostCategory.HEALTH;
          break;
        case 'LIFESTYLE':
          enumCategory = PostCategory.LIFESTYLE;
          break;
        case 'TRAVEL':
          enumCategory = PostCategory.TRAVEL;
          break;
        case 'FOOD':
          enumCategory = PostCategory.FOOD;
          break;
        default:
          // wenn die Kategorie nicht in der Liste ist, dann wird sie als OTHER gespeichert
          enumCategory = PostCategory.OTHER;
          break;
      }
      updateData.category = enumCategory;
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: updateData,
    });

    return {
      message: 'Post updated',
      data: updatedPost,
    };
  }

  async publishPost(userId: string, postId: string) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, published: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }
      if (post.authorId !== userId) {
        throw new ForbiddenException('You are not the author of this post');
      }
      if (post.published) {
        throw new BadRequestException('Post is already published');
      }

      await this.prisma.post.update({
        where: { id: postId },
        data: {
          published: true,
          publishedAt: new Date(),
        },
      });

      return {
        message: 'Post successfully published',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException('Failed to publish post', {
          cause: err,
          description: 'Failed to publish post',
        });
      }
    }
  }

  async unpublishPost(user: { id: string; roles: UserRoles }, postId: string) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, published: true },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }
      const isAdmin = user.roles === UserRoles.ADMIN;
      const isMod = user.roles === UserRoles.MODERATOR;
      const isAuthor = post.authorId === user.id;

      if (!isAdmin && !isMod && !isAuthor) {
        throw new ForbiddenException('You are not the author of this post');
      }
      if (!post.published) {
        throw new BadRequestException('Post is already unpublished');
      }
      const updateData = {
        published: false,
        publishedAt: null,
      };

      if (isAdmin || isMod) {
        updateData['moderatorId'] = user.id;
      }
      await this.prisma.post.update({
        where: { id: postId },
        data: updateData,
      });

      return {
        message: 'Post successfully unpublished',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException('Failed to unpublish post', {
          cause: err,
          description: 'Failed to unpublish post',
        });
      }
    }
  }

  async addPostImage(
    user: { id: string; roles: UserRoles },
    postId: string,
    file: Express.Multer.File,
  ) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, image: true, publicId_image: true },
      });

      if (!post) throw new NotFoundException('Post not found');
      if (post.authorId && post.authorId !== user.id) {
        throw new ForbiddenException(
          'You are not the author of this post, so you cannot add an image',
        );
      }
      if (!file) throw new BadRequestException('No file provided');

      // falls bild vorhanden, dann lieber löschen, als das die software zusammenbricht
      if (post.image && post.publicId_image) {
        await this.cloudinaryService.deleteFile(post.publicId_image);
      }
      // neues bild uploaden
      const image = await this.cloudinaryService.uploadFile(file, 'posts/main');
      if (!image || !image.secure_url) {
        throw new BadRequestException('Failed to upload image');
      }
      const isAdmin = user.roles === UserRoles.ADMIN;
      const isMod = user.roles === UserRoles.MODERATOR;

      const data = {
        image: image.secure_url,
        publicId_image: image.public_id,
      };

      if (post.authorId === null && (isAdmin || isMod)) {
        data['moderatorId'] = user.id;
      }
      await this.prisma.post.update({
        where: { id: postId },
        data: data,
      });

      return 'Image added to post';
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException('Failed to add image to post', {
        cause: err,
        description: 'Failed to add image to post',
      });
    }
  }

  async removePostImage(
    user: { id: string; roles: UserRoles },
    postId: string,
  ) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, image: true, publicId_image: true },
      });

      if (!post) throw new NotFoundException('Post not found');
      const isAdmin = user.roles === UserRoles.ADMIN;
      const isMod = user.roles === UserRoles.MODERATOR;
      const isAuthor = post.authorId === user.id;

      if (!isAdmin && !isMod && !isAuthor) {
        throw new ForbiddenException('You are not the author of this post');
      }
      const data = {
        image: null,
        publicId_image: null,
      };
      // Mods sollten anstoßige Bilder die nicht zum Kontext passen entfernen können
      if (isAdmin || isMod) {
        data['moderatorId'] = user.id;
      }

      // hier sollte noch eine mail an den author geschickt werden, dass das bild entfernt wurde
      try {
        if (post.publicId_image) {
          await this.cloudinaryService.deleteFile(post.publicId_image);
        }
      } catch (err) {
        throw new BadRequestException('failed to delete image', {
          cause: err,
          description: 'failed to delete image',
        });
      }

      await this.prisma.post.update({
        where: { id: postId },
        data: data,
      });

      return 'image removed from post';
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException('Failed to remove image from post', {
        cause: err,
        description: 'Failed to remove image from post',
      });
    }
  }

  async addChapter(
    postId: string,
    userId: string,
    data: any,
    file?: Express.Multer.File,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, published: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not the author of this post');
    }

    let image;
    if (file) {
      image = await this.cloudinaryService.uploadFile(file, 'posts/chapters');

      if (!image || !image.secure_url) {
        throw new BadRequestException('Failed to upload image');
      }
    }

    const updatedDTO: ChapterDto = {
      ...data,
      image: image?.secure_url ?? null,
      publicId_image: image?.public_id ?? null,
    };

    return this.chapterService.addNewChapter(postId, updatedDTO);
  }

  async updateChapter(
    postId: string,
    user: { id: string; roles: UserRoles },
    data: UpdateChapterDto,
    chapterId: string,
    file?: Express.Multer.File,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { chapters: true },
    });
    const chapter = post?.chapters.find((c) => c.id === chapterId);
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (
      post.authorId !== user.id &&
      user.roles !== UserRoles.ADMIN &&
      user.roles !== UserRoles.MODERATOR
    ) {
      throw new ForbiddenException('You are not the author of this post');
    }

    if (user.roles === UserRoles.ADMIN || user.roles === UserRoles.MODERATOR) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { moderatorId: user.id, published: false, publishedAt: null },
      });
    }

    const newChapter = await this.chapterService.updateChapter(
      chapterId,
      data,
      file,
    );

    return {
      message: 'Chapter updated',
      data: newChapter,
    };
  }

  async addChapterImage(
    user: { id: string; roles: UserRoles },
    file: Express.Multer.File,
    postId: string,
    chapterId: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    const isAdmin = user.roles === UserRoles.ADMIN;
    const isMod = user.roles === UserRoles.MODERATOR;
    const isAuthor = post?.authorId === user.id;

    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (!isAdmin && !isMod && !isAuthor) {
      throw new ForbiddenException('You are not the author of this post');
    }
    if (!file) throw new BadRequestException('No file provided');

    const data: { moderatorId?: string } = {};
    if (post.authorId === null && (isAdmin || isMod)) {
      data['moderatorId'] = user.id;
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    await this.chapterService.addImage(chapterId, file);
    return {
      message: 'Image added to chapter',
      data: updatedPost,
    };
  }

  async removeChapterImage(
    user: { id: string; roles: UserRoles },
    postId: string,
    chapterId: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    const isAdmin = user.roles === UserRoles.ADMIN;
    const isMod = user.roles === UserRoles.MODERATOR;
    const isAuthor = post?.authorId === user.id;

    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (!isAdmin && !isMod && !isAuthor) {
      throw new ForbiddenException('You are not the author of this post');
    }

    const data: { moderatorId?: string } = {};
    if (post.authorId === null && (isAdmin || isMod)) {
      data['moderatorId'] = user.id;
    }

    await this.prisma.$transaction(async (tx) => {
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      await this.chapterService.removeImage(chapterId, tx);
    });

    return 'Image removed from chapter';
  }

  async addQuiz(userId: string, postId: string, data: CreateQuizDto) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        include: { quiz: true },
      });

      if (!post) throw new NotFoundException('Database error');

      if (post.authorId !== userId) {
        throw new UnauthorizedException(
          'You are not the author of this post, so you cannot add a quiz',
        );
      }

      if (post.quiz) {
        throw new BadRequestException(
          'Post already has a quiz, you cannot add another one',
        );
      }

      const quiz = await this.quizService.createQuiz(postId, data);

      return {
        message: 'Quiz created',
        data: quiz,
      };
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      } else if (err instanceof UnauthorizedException) {
        throw err;
      } else if (err instanceof BadRequestException) {
        throw err;
      } else {
        throw new BadRequestException('Failed to create quiz', {
          cause: err,
          description: 'Failed to create quiz',
        });
      }
    }
  }

  /**
   * update function could implemented as the same way like delete function, only question by question, and answer by answer
   */

  // update funktion for quizzes
  async addQuestion(
    user: { id: string; roles: UserRoles },
    postId: string,
    data: QuizQuestionDto,
  ) {
    try {
      return this.prisma.$transaction(async (tx) => {
        const post = await tx.post.findUnique({
          where: { id: postId },
          include: { quiz: true },
        });

        if (!post || !post.quiz) {
          throw new NotFoundException('Post or quiz not found');
        }

        const isAdmin = user.roles === UserRoles.ADMIN;
        const isMod = user.roles === UserRoles.MODERATOR;
        const isAuthor = post.authorId === user.id;

        if (!isAdmin && !isMod && !isAuthor) {
          throw new ForbiddenException('You are not the author of this post');
        }

        if ((isAdmin || isMod) && post.authorId === null) {
          await tx.post.update({
            where: { id: postId },
            data: {
              moderatorId: user.id,
            },
          });
        }

        const quiz = await this.quizService.addQuestion(post.quiz.id, data, tx);

        return {
          message: 'Question added to quiz',
          data: quiz,
        };
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new BadRequestException('Failed to add question to quiz', {
        cause: err,
        description: 'Failed to add question to quiz',
      });
    }
  }

  // wir könnten auch nur mit der questionId arbeiten und nach oben joinen, aber das macht die datenbank nicht mit da wir nur 100MB haben

  async removeQuestion(
    user: { id: string; roles: UserRoles },
    postId: string,
    quizId: string,
    questionId: string,
  ) {
    try {
      return this.prisma.$transaction(async (tx) => {
        const post = await tx.post.findUnique({
          where: { id: postId },
          include: { quiz: true },
        });

        if (!post || !post.quiz) {
          throw new NotFoundException('Post or quiz not found');
        }

        if (post.quiz.id !== quizId) {
          throw new NotFoundException(
            'the requested quiz is not part of this post',
          );
        }

        const isAdmin = user.roles === UserRoles.ADMIN;
        const isMod = user.roles === UserRoles.MODERATOR;
        const isAuthor = post.authorId === user.id;

        if (!isAdmin && !isMod && !isAuthor) {
          throw new ForbiddenException('You are not the author of this post');
        }

        if ((isAdmin || isMod) && post.authorId === null) {
          await tx.post.update({
            where: { id: postId },
            data: {
              moderatorId: user.id,
            },
          });
        }

        if ((isAdmin || isMod) && post.authorId !== null) {
          await tx.post.update({
            where: { id: postId },
            data: {
              published: false,
              publishedAt: null,
              moderatorId: user.id,
            },
          });

          // hier sollte noch die mail an den author geschickt werden, dass der post vom moderator bearbeitet wurde
        }

        await this.quizService.removeQuestion(questionId, tx);
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new BadRequestException('Failed to remove question from quiz', {
        cause: err,
        description: 'Failed to remove question from quiz',
      });
    }
  }

  async addAnswer(
    user: { id: string; roles: UserRoles },
    postId: string,
    quizId: string,
    quesitonId: string,
    data: QuizAnswerDto,
  ) {
    try {
      return this.prisma.$transaction(async (tx) => {
        const post = await tx.post.findUnique({
          where: { id: postId },
          include: { quiz: true },
        });

        if (!post || !post.quiz) {
          throw new NotFoundException('Post or quiz not found');
        }

        if (post.quiz.id !== quizId) {
          throw new NotFoundException(
            'the requested quiz is not part of this post',
          );
        }

        const isAdmin = user.roles === UserRoles.ADMIN;
        const isMod = user.roles === UserRoles.MODERATOR;
        const isAuthor = post.authorId === user.id;
        const isOrphaned = post.authorId === null;

        console.log(
          `ìsAdmin: ${isAdmin} \nisMod: ${isMod} \nisAuthor: ${isAuthor}\nisOrphaned: ${isOrphaned}`,
        );

        if (!(isAuthor || (isOrphaned && (isAdmin || isMod)))) {
          throw new ForbiddenException('You are not the author of this post');
        }

        if (isOrphaned && (isAdmin || isMod)) {
          await tx.post.update({
            where: { id: postId },
            data: {
              moderatorId: user.id,
            },
          });
        }

        const answer = await this.quizService.addAnswer(quesitonId, data, tx);

        return {
          message: 'Answer added to question',
          data: answer,
        };
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException('Failed to add answer to question', {
        cause: err,
        description: 'Failed to add answer to question',
      });
    }
  }

  async removeAnswer(
    user: { id: string; roles: UserRoles },
    postId: string,
    quizId: string,
    questionId: string,
    answerId: string,
  ) {
    try {
      return this.prisma.$transaction(async (tx) => {
        const post = await tx.post.findUnique({
          where: { id: postId },
          include: { quiz: true },
        });

        if (!post || !post.quiz) {
          throw new NotFoundException('Post or quiz not found');
        }

        if (post.quiz.id !== quizId) {
          throw new NotFoundException(
            'the requested quiz is not part of this post',
          );
        }

        const isAdmin = user.roles === UserRoles.ADMIN;
        const isMod = user.roles === UserRoles.MODERATOR;
        const isAuthor = post.authorId === user.id;
        const isOrphaned = post.authorId === null;

        console.log(
          `ìsAdmin: ${isAdmin} \nisMod: ${isMod} \nisAuthor: ${isAuthor}\nisOrphaned: ${isOrphaned}`,
        );

        if (!isAuthor && !isAdmin && !isMod) {
          throw new ForbiddenException('You are not the author of this post');
        }

        if (isAdmin || isMod) {
          const data = {
            moderatorId: user.id,
          };

          if (isOrphaned) {
            data['published'] = false;
            data['publishedAt'] = null;

            // hier sollte noch die mail an den author geschickt werden, dass der post vom moderator bearbeitet wurde
          }

          await tx.post.update({
            where: { id: postId },
            data,
          });
        }

        await this.quizService.removeAnswer(questionId, answerId, tx);

        return 'Answer removed from question';
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException('Failed to remove answer from question', {
        cause: err,
        description: 'Failed to remove answer from question',
      });
    }
  }

  // DELETE POST

  deletePost(
    user: { id: string; roles: UserRoles },
    postId: string,
    dto: DeleteReasonDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
      });

      if (!post) throw new NotFoundException('Post not found');
      if (post.isDeleted) {
        throw new BadRequestException('Post is already deleted');
      }

      const isAdmin = user.roles === UserRoles.ADMIN;
      const isMod = user.roles === UserRoles.MODERATOR;
      const isAuthor = post.authorId === user.id;

      if (!isAdmin && !isMod && !isAuthor) {
        throw new ForbiddenException(
          'You are not authorized to delete this post',
        );
      }

      if ((isAdmin || isMod) && post.authorId) {
        await tx.user.update({
          where: { id: post.authorId },
          data: {
            moderatedAt: new Date(),
            moderatedBy: user.id,
          },
        });
      }

      await tx.post.update({
        where: { id: postId },
        data: {
          published: false,
          publishedAt: null,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: user.id,
          deleteReason: dto.reason || 'no reason provided',
        },
      });
      return 'Post deleted, to restore it, please contact our support';
    });
  }

  async restorePost(postId: string) {
    try {
      return this.prisma.$transaction(async (tx) => {
        const post = await tx.post.findUnique({
          where: { id: postId },
          select: {
            id: true,
            isDeleted: true,
          },
        });

        if (!post) throw new NotFoundException('Post not found');

        if (!post.isDeleted) {
          throw new BadRequestException('Post is not deleted');
        }

        await tx.post.update({
          where: { id: postId },
          data: {
            published: false,
            publishedAt: null,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            deleteReason: null,
          },
        });
        return {
          message: 'Post restored',
        };
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new BadRequestException('Failed to restore post', {
        cause: err,
        description: 'Failed to restore post',
      });
    }
  }

  // role is optional, because the main usage for this function will be for cron jobs
  removePost(postId: string, role?: UserRoles) {
    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        include: { quiz: true, chapters: true },
      });

      if (!post) throw new NotFoundException('Post not found');

      if (role && role !== UserRoles.ADMIN) {
        throw new ForbiddenException(
          'You are not authorized to delete this post',
        );
      }
      // we dont need to delete the quiz and chapters, because they will be deleted by the post cascade
      await tx.post.delete({
        where: { id: postId },
      });

      return 'Post deleted';
    });
  }
}
