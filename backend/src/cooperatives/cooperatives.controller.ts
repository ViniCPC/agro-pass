import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CooperativesService } from './cooperatives.service';
import { ImportProducersResponseDto } from './dto/import-producers-response.dto';
import { UserRole } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles(UserRole.COOPERATIVE, UserRole.ADMIN)
@Controller('cooperatives')
export class CooperativesController {
  constructor(private readonly cooperativesService: CooperativesService) {}

  @Post(':id/producers/import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  async importProducers(
    @Param('id') cooperativeId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ): Promise<ImportProducersResponseDto> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (user.role !== UserRole.ADMIN && user.cooperativeId !== cooperativeId) {
      throw new ForbiddenException(
        'Cooperativa so pode importar produtores para a propria conta.',
      );
    }

    return this.cooperativesService.importProducersFromCsv({
      cooperativeId,
      csvBuffer: file.buffer,
    });
  }
}
