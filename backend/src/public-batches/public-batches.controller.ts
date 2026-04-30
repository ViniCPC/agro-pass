import { Controller, Get, Param } from '@nestjs/common';
import { PublicBatchesService } from './public-batches.service';

@Controller('public/batches')
export class PublicBatchesController {
  constructor(private readonly publicBatchesService: PublicBatchesService) {}

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.publicBatchesService.findByCode(code);
  }
}