import { Module } from '@nestjs/common';
import { FILE_STORAGE } from './file-storage';
import type { FileStorage } from './file-storage';
import { LocalFileStorage } from './local-file-storage.service';
import { SupabaseFileStorage } from './supabase-file-storage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicFilesController } from './public-files.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PublicFilesController],
  providers: [
    {
      provide: FILE_STORAGE,
      // A factory, so the Supabase client is only built when it is the
      // selected provider.
      useFactory: (): FileStorage => {
        const provider = process.env.STORAGE_PROVIDER || 'local';

        if (provider === 'supabase') {
          return new SupabaseFileStorage();
        }

        if (provider === 'local') {
          return new LocalFileStorage();
        }

        throw new Error(`Storage provider invalido: ${provider}`);
      },
    },
  ],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
