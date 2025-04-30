import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { error } from 'console';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 4001);
}
bootstrap().catch((e: any) => {
  error(`internal server error: ${e}`);
  process.exit(1);
});
