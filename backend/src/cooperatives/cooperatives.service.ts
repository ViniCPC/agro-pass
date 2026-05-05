import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Papa from 'papaparse';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]{6,80}$/;

type ImportProducersFromCsvInput = {
  cooperativeId: string;
  csvBuffer: Buffer;
};

type ProducerCsvRow = {
  name: string;
  document: string;
  phone: string;
  farmName: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  carNumber?: string;
};

export type ImportProducersFromCsvResult = {
  cooperativeId: string;
  producers: {
    created: number;
    updated: number;
  };
  farms: {
    created: number;
    updated: number;
  };
  skippedRows: number;
  errors: Array<{ row: number; reason: string }>;
};

@Injectable()
export class CooperativesService {
  constructor(private readonly prisma: PrismaService) {}

  async importProducersFromCsv(
    input: ImportProducersFromCsvInput,
  ): Promise<ImportProducersFromCsvResult> {
    const cooperative = await this.prisma.cooperative.findUnique({
      where: { id: input.cooperativeId },
    });

    if (!cooperative) {
      throw new NotFoundException('Cooperativa nao encontrada');
    }

    const parsed = Papa.parse<ProducerCsvRow>(
      input.csvBuffer.toString('utf-8'),
      {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      },
    );

    if (parsed.errors.length > 0) {
      throw new BadRequestException({
        message: 'CSV invalido',
        errors: parsed.errors,
      });
    }

    const result: ImportProducersFromCsvResult = {
      cooperativeId: cooperative.id,
      producers: {
        created: 0,
        updated: 0,
      },
      farms: {
        created: 0,
        updated: 0,
      },
      skippedRows: 0,
      errors: [],
    };

    for (const [index, row] of parsed.data.entries()) {
      try {
        this.validateRow(row, index + 2);

        const document = this.normalizeDocument(row.document);
        const phone = this.normalizePhone(row.phone);
        const carNumber = row.carNumber?.trim() || null;

        const existingProducer = await this.prisma.producer.findUnique({
          where: { document },
          select: { id: true },
        });

        const producer = existingProducer
          ? await this.prisma.producer.update({
              where: { document },
              data: {
                name: row.name.trim(),
                phone,
                cooperativeId: cooperative.id,
              },
            })
          : await this.prisma.producer.create({
              data: {
                name: row.name.trim(),
                document,
                phone,
                cooperativeId: cooperative.id,
              },
            });

        if (existingProducer) {
          result.producers.updated++;
        } else {
          result.producers.created++;
        }

        const existingFarm = carNumber
          ? await this.prisma.farm.findUnique({
              where: { carNumber },
              select: { id: true },
            })
          : await this.prisma.farm.findFirst({
              where: {
                producerId: producer.id,
                name: row.farmName.trim(),
              },
              select: { id: true },
            });

        const farmData = {
          name: row.farmName.trim(),
          city: row.city.trim(),
          state: row.state.trim().toUpperCase(),
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          carNumber,
          producerId: producer.id,
        };

        if (existingFarm) {
          await this.prisma.farm.update({
            where: { id: existingFarm.id },
            data: farmData,
          });
          result.farms.updated++;
        } else {
          await this.prisma.farm.create({
            data: farmData,
          });
          result.farms.created++;
        }
      } catch (error) {
        result.skippedRows++;
        result.errors.push({
          row: index + 2,
          reason:
            error instanceof Error
              ? error.message
              : 'Erro desconhecido ao importar linha',
        });
      }
    }

    return result;
  }

  async findByInviteCode(inviteCode: string) {
    const normalizedInviteCode = inviteCode.trim();

    if (!INVITE_CODE_PATTERN.test(normalizedInviteCode)) {
      return null;
    }

    return this.prisma.cooperative.findUnique({
      where: { inviteCode: normalizedInviteCode },
    });
  }

  private validateRow(row: ProducerCsvRow, rowNumber: number) {
    const requiredFields: Array<keyof ProducerCsvRow> = [
      'name',
      'document',
      'phone',
      'farmName',
      'city',
      'state',
      'latitude',
      'longitude',
    ];

    for (const field of requiredFields) {
      if (!row[field] || String(row[field]).trim().length === 0) {
        throw new Error(
          `Linha ${rowNumber}: campo obrigatorio ausente: ${field}`,
        );
      }
    }

    const document = this.normalizeDocument(row.document);
    if (![11, 14].includes(document.length)) {
      throw new Error(`Linha ${rowNumber}: CPF/CNPJ invalido`);
    }

    const phone = this.normalizePhone(row.phone);
    if (phone.length < 10 || phone.length > 11) {
      throw new Error(`Linha ${rowNumber}: telefone invalido`);
    }

    if (Number.isNaN(Number(row.latitude))) {
      throw new Error(`Linha ${rowNumber}: latitude invalida`);
    }

    if (Number.isNaN(Number(row.longitude))) {
      throw new Error(`Linha ${rowNumber}: longitude invalida`);
    }
  }

  private normalizeDocument(document: string) {
    return document.replace(/\D/g, '');
  }

  private normalizePhone(phone: string) {
    return phone.replace(/\D/g, '');
  }
}
