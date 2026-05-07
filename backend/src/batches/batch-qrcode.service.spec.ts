import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BatchQrCodeService } from './batch-qrcode.service';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('qrcode', () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-png')),
}));

describe('BatchQrCodeService', () => {
  let service: BatchQrCodeService;
  let batchFindUnique: jest.Mock;
  let batchUpdate: jest.Mock;

  beforeEach(async () => {
    batchFindUnique = jest.fn();
    batchUpdate = jest.fn().mockResolvedValue({});

    const module = await Test.createTestingModule({
      providers: [
        BatchQrCodeService,
        {
          provide: PrismaService,
          useValue: { batch: { findUnique: batchFindUnique, update: batchUpdate } },
        },
      ],
    }).compile();

    service = module.get(BatchQrCodeService);
  });

  it('lança NotFoundException quando o lote não existe', async () => {
    batchFindUnique.mockResolvedValue(null);

    await expect(service.generateQrCode('x')).rejects.toThrow(NotFoundException);
  });

  it('retorna qrCodeUrl, targetUrl, batchId e batchCode no caminho feliz', async () => {
    batchFindUnique.mockResolvedValue({ id: 'batch-uuid', code: 'CAF-2026-0001', qrCodeUrl: null });

    const result = await service.generateQrCode('batch-uuid');

    expect(result.batchId).toBe('batch-uuid');
    expect(result.batchCode).toBe('CAF-2026-0001');
    expect(result.qrCodeUrl).toMatch(/^\/uploads\/qrcodes\//);
    expect(result.targetUrl).toContain('CAF-2026-0001');
  });

  it('targetUrl usa PUBLIC_APP_URL do ambiente', async () => {
    process.env.PUBLIC_APP_URL = 'https://app.agropass.com.br';
    batchFindUnique.mockResolvedValue({ id: 'batch-uuid', code: 'CAF-2026-0001', qrCodeUrl: null });

    const result = await service.generateQrCode('batch-uuid');

    expect(result.targetUrl).toBe('https://app.agropass.com.br/trace/CAF-2026-0001');
    delete process.env.PUBLIC_APP_URL;
  });

  it('usa localhost como fallback quando PUBLIC_APP_URL não está definido', async () => {
    const saved = process.env.PUBLIC_APP_URL;
    delete process.env.PUBLIC_APP_URL;
    batchFindUnique.mockResolvedValue({ id: 'batch-uuid', code: 'CAF-2026-0001', qrCodeUrl: null });

    const result = await service.generateQrCode('batch-uuid');

    expect(result.targetUrl).toContain('localhost');
    process.env.PUBLIC_APP_URL = saved;
  });

  it('persiste qrCodeUrl no banco após gerar a imagem', async () => {
    batchFindUnique.mockResolvedValue({ id: 'batch-uuid', code: 'CAF-2026-0001', qrCodeUrl: null });

    await service.generateQrCode('batch-uuid');

    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'batch-uuid' },
        data: expect.objectContaining({ qrCodeUrl: expect.stringMatching(/^\/uploads\/qrcodes\//) }),
      }),
    );
  });
});
