import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CooperativesService } from './cooperatives.service';
import { ImportProducersResponseDto } from './dto/import-producers-response.dto';

@Controller('cooperatives')
export class CooperativesController {
  constructor(private readonly cooperativesService: CooperativesService) {}

  @Post(':id/producers/import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducers(
    @Param('id') cooperativeId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportProducersResponseDto> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    return this.cooperativesService.importProducersFromCsv({
      cooperativeId,
      csvBuffer: file.buffer,
    });
  }
}
