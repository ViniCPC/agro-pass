import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BatchStatus, DocumentType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ValidateBatchResponseDto } from './dto/validate-batch-response.dto';

@Injectable()
export class BatchValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateBatch(batchId: string): Promise<ValidateBatchResponseDto> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        farm: true,
        documents: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado.');
    }

    if (batch.documents.length === 0) {
      throw new BadRequestException(
        'Adicione pelo menos um documento antes de validar o lote.',
      );
    }

    const hasCarDocument = batch.documents.some(
      (document) => document.type === DocumentType.CAR,
    );

    if (!hasCarDocument) {
      throw new BadRequestException(
        'Adicione o documento CAR antes de validar o lote.',
      );
    }

    const updatedBatch = await this.prisma.batch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.VERIFIED,
      },
    });

    return {
      batchId: updatedBatch.id,
      status: updatedBatch.status,
      documentsValidated: batch.documents.length,
      checks: {
        carDocumentFound: hasCarDocument,
        farmLocationProvided:
          Number.isFinite(batch.farm.latitude) &&
          Number.isFinite(batch.farm.longitude),
        environmentalValidation: 'MOCKED',
      },
      message: 'Lote validado para demonstracao EUDR',
    };
  }
}
