import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp, createLogger } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: createLogger(),
  });
  configureApp(app);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
