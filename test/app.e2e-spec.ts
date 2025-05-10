import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.family.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  it('/auth/register (POST)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send({
      name: 'streber',
      email: 'streber@gmail.com',
      phone: '049017612345678',
      password: 'Gr33nFr0g#s4v3',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'the family is registered',
      family: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(Number),
        name: 'streber',
        email: 'streber@gmail.com',
        phone: '049017612345678',
      },
    });
    expect(res.body).not.toHaveProperty('password');
  });
});
