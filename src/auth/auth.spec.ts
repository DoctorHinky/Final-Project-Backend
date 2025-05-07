import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppModule } from 'src/app.module';

const validUser = {
  firstname: 'billy',
  lastname: 'bolly',
  username: 'billy bolly',
  birthdate: '2007-01-01',
  role: 'CHILD',
  email: 'bill.bolly@gmail.com',
  phone: '0490174684753',
  password: 'Gr33nFr0g#s4v3',
};

describe('AppController unit', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app = moduleFixture.createNestApplication();

    // 🛡️ Global Validation aktivieren (wie im echten App-Start)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  it('/auth/register (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...validUser,
        birthdate: '2030-02-11',
      });
    expect(res.status).toBe(400);
  });
  it('/auth/register (POST) mit gültigem Datum', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validUser);
    expect(res.status).toBe(201);
  });

  it('/auth/register (POST) mit bereits existierendem User', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validUser);
    expect(res.status).toBe(400);
  });

  it('/auth/register (POST) mit ungültigem Passwort', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...validUser,
        password: '1234',
      });
    expect(res.status).toBe(400);
  });

  it('/auth/register (POST) mit ungültiger Email', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...validUser,
        email: 'invalidEmail',
      });
    expect(res.status).toBe(400);
  });

  it('/auth/register (POST) mit ungültiger Telefonnummer', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...validUser,
        phone: '123842',
      });
    expect(res.status).toBe(400);
  });

  it('/auth/register (POST) mit ungültigem Namen', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...validUser,
        firstname: '',
      });
    expect(res.status).toBe(400);
  });
});
