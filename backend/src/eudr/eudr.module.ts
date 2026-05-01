import { Module } from '@nestjs/common';
import { EudrController } from './eudr.controller';
import { EudrService } from './eudr.service';
import { HansenService } from './sources/hansen.service';
import { MapBiomasService } from './sources/mapbiomas.service';
import { ProdesService } from './sources/prodes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EudrController],
  providers: [EudrService, MapBiomasService, ProdesService, HansenService],
  exports: [EudrService],
})
export class EudrModule {}
