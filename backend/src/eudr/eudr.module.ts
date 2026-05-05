import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { EudrQueryService } from './eudr-query.service';
import { EudrValidateService } from './eudr-validate.service';
import { EudrController } from './eudr.controller';
import { HansenService } from './sources/hansen.service';
import { MapBiomasService } from './sources/mapbiomas.service';
import { ProdesService } from './sources/prodes.service';
import { SentinelService } from './sources/sentinel.service';

@Module({
  imports: [PrismaModule],
  controllers: [EudrController],
  providers: [
    EudrValidateService,
    EudrQueryService,
    MapBiomasService,
    ProdesService,
    HansenService,
    SentinelService,
  ],
  exports: [EudrValidateService, EudrQueryService],
})
export class EudrModule {}
