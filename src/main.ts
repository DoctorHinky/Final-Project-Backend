import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { error } from 'console';
import { ValidationPipe } from '@nestjs/common';
import { TrimPipe } from './common/pipes/trim.pipe';
import { JwtExceptionFilter } from './common/filter/jwt-exception.filter';
import { MulterExceptionFilter } from './common/filter/Multer-excetion.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* app.enableCors({
    origin: `http://localhost:${process.env.FRONTEND_PORT}`, // erlaubt nur diese Domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }); */

  // das öffnet die API für alle Domains
  app.enableCors({
    origin: '*',
  });
  app.useGlobalFilters(new JwtExceptionFilter(), new MulterExceptionFilter());
  app.useGlobalPipes(
    new TrimPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // error if a non-whitelisted property is found
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  await app.listen(process.env.PORT ?? 4001);
  console.log(`Server is running on port ${process.env.PORT ?? 4001}`);
}
bootstrap().catch((e: any) => {
  error(`internal server error: ${e}`);
  process.exit(1);
});
