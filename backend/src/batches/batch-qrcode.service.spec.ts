import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { BatchQrCodeService } from './batch-qrcode.service';

jest.mock('qrcode', () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-png')),
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,ZmFrZQ=='),
}));

describe('BatchQrCodeService', () => {
  let service: BatchQrCodeService;
  let batchFindUnique: jest.Mock;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    batchFindUnique = jest.fn().mockResolvedValue({
      id: 'batch-uuid',
      code: 'AGP-2026-0001',
      publicCode: 'public-passport-code',
    });

    const module = await Test.createTestingModule({
      providers: [
        BatchQrCodeService,
        {
          provide: PrismaService,
          useValue: { batch: { findUnique: batchFindUnique } },
        },
      ],
    }).compile();

    service = module.get(BatchQrCodeService);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PUBLIC_APP_URL;
  });

  it('rejeita lote inexistente', async () => {
    batchFindUnique.mockResolvedValue(null);
    await expect(service.generateQrCode('x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('gera o QR em memoria usando o codigo publico do passaporte', async () => {
    const result = await service.generateQrCode('batch-uuid');

    expect(result.batchCode).toBe('AGP-2026-0001');
    expect(result.publicCode).toBe('public-passport-code');
    expect(result.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.targetUrl).toBe(
      'http://localhost:5173/trace/public-passport-code',
    );
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      result.targetUrl,
      expect.any(Object),
    );
  });

  it('respeita PUBLIC_APP_URL e remove barra final', async () => {
    process.env.PUBLIC_APP_URL = 'https://app.agropass.com.br/';

    const result = await service.generateQrCode('batch-uuid');
    expect(result.targetUrl).toBe(
      'https://app.agropass.com.br/trace/public-passport-code',
    );
  });

  it('recusa gerar QR com localhost em producao', async () => {
    process.env.NODE_ENV = 'production';

    await expect(service.generateQrCode('batch-uuid')).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(
      service.generatePrintSheetPdf('batch-uuid', 4),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
