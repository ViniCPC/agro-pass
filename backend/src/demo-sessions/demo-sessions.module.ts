import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { DemoSessionsController } from './demo-sessions.controller';
import { DemoSessionsService } from './demo-sessions.service';

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [DemoSessionsController],
  providers: [DemoSessionsService],
  exports: [DemoSessionsService],
})
export class DemoSessionsModule {}
