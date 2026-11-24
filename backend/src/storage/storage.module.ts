import { Module } from '@nestjs/common';
import { FILE_STORAGE } from './file-storage';
import { LocalFileStorage } from './local-file-storage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicFilesController } from './public-files.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PublicFilesController],
  providers: [
    LocalFileStorage,
    { provide: FILE_STORAGE, useExisting: LocalFileStorage },
  ],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
