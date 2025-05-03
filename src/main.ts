import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { error } from 'console';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
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
}
bootstrap().catch((e: any) => {
  error(`internal server error: ${e}`);
  process.exit(1);
});
