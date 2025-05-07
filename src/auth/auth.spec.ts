import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppModule } from 'src/app.module';

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
    await prisma.user.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  it('/auth/register (POST)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send({
      firstname: 'billy',
      lastname: 'bolly',
      username: 'billy bolly',
      birthdate: '2007-01-01',
      role: 'CHILD',
      email: 'bill.bolly@gmail.com',
      phone: '049017612345678',
      password: 'Gr33nFr0g#s4v3',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'new User is created',
      user: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(Number),
        firstname: 'billy',
        lastname: 'bolly',
        username: 'billy bolly',
        birthdate: '2007-01-01T00:00:00.000Z',
        role: 'CHILD',
        email: 'bill.bolly@gmail.com',
        phone: '049017612345678',
      },
    });
    expect(res.body).not.toHaveProperty('password');
  });
});
