import { Module } from '@nestjs/common';
import { CarParserService } from './car-parser.service';

@Module({
  providers: [CarParserService],
  exports: [CarParserService],
})
export class AiModule {}