import { TraceEventType } from '../../generated/prisma/enums';
import { EventHashService } from './event-hash.service';

describe('EventHashService', () => {
  const service = new EventHashService();
  const input = {
    batchId: 'batch-1',
    sequence: 2,
    type: TraceEventType.HARVESTED,
    recordedById: 'user-1',
    recordedAt: new Date('2026-11-24T12:00:00.000Z'),
    location: 'Rio Verde, GO',
    previousHash: 'hash-anterior',
    documentHashes: ['hash-b', 'hash-a'],
  };

  it('gera SHA-256 deterministico e independe da ordem dos documentos', () => {
    const first = service.generate(input);
    const second = service.generate({
      ...input,
      documentHashes: ['hash-a', 'hash-b'],
    });

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
  });

  it('muda quando um dado auditavel e alterado', () => {
    expect(service.generate({ ...input, location: 'Santos, SP' })).not.toBe(
      service.generate(input),
    );
  });

  it('inclui o hash anterior na composicao', () => {
    expect(service.generate({ ...input, previousHash: 'outro-hash' })).not.toBe(
      service.generate(input),
    );
  });
});
