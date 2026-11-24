import { TraceEventType } from '../../generated/prisma/enums';
import { EventHashService } from '../trace-events/event-hash.service';
import { EventChainService } from './event-chain.service';

describe('EventChainService', () => {
  const hashService = new EventHashService();

  it('encadeia o segundo evento ao hash do primeiro e atualiza o lote', async () => {
    const traceEventCreate = jest.fn(({ data }) => ({
      id: 'event-2',
      ...data,
      recordedBy: { id: 'user-2', name: 'Operador', role: 'OPERATOR' },
      documents: [],
    }));
    const batchUpdate = jest.fn();
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'batch-1' }]),
      traceEvent: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ sequence: 1, eventHash: 'hash-do-evento-1' }),
        create: traceEventCreate,
      },
      document: { findMany: jest.fn() },
      batch: { update: batchUpdate },
    };
    const service = new EventChainService({} as never, hashService);

    await service.appendInTransaction(transaction as never, {
      batchId: 'batch-1',
      type: TraceEventType.IN_TRANSIT,
      recordedById: 'user-2',
      recordedAt: new Date('2026-11-24T12:00:00.000Z'),
    });

    expect(traceEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sequence: 2,
          previousHash: 'hash-do-evento-1',
          eventHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { integrityHash: expect.stringMatching(/^[a-f0-9]{64}$/) },
      }),
    );
  });

  it('valida uma cadeia intacta e detecta adulteracao manual', async () => {
    const firstAt = new Date('2026-11-24T10:00:00.000Z');
    const secondAt = new Date('2026-11-24T11:00:00.000Z');
    const firstHash = hashService.generate({
      batchId: 'batch-1',
      sequence: 1,
      type: TraceEventType.CREATED,
      recordedById: 'user-1',
      recordedAt: firstAt,
      previousHash: null,
    });
    const secondHash = hashService.generate({
      batchId: 'batch-1',
      sequence: 2,
      type: TraceEventType.HARVESTED,
      recordedById: 'user-1',
      recordedAt: secondAt,
      location: 'Fazenda A',
      previousHash: firstHash,
    });
    const events = [
      {
        id: 'event-1',
        batchId: 'batch-1',
        sequence: 1,
        type: TraceEventType.CREATED,
        recordedById: 'user-1',
        recordedAt: firstAt,
        location: null,
        latitude: null,
        longitude: null,
        notes: null,
        previousHash: null,
        eventHash: firstHash,
        txHash: null,
        correctedEventId: null,
        documents: [],
      },
      {
        id: 'event-2',
        batchId: 'batch-1',
        sequence: 2,
        type: TraceEventType.HARVESTED,
        recordedById: 'user-1',
        recordedAt: secondAt,
        location: 'Fazenda A',
        latitude: null,
        longitude: null,
        notes: null,
        previousHash: firstHash,
        eventHash: secondHash,
        txHash: null,
        correctedEventId: null,
        documents: [],
      },
    ];
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({ integrityHash: secondHash, traceEvents: events })
      .mockResolvedValueOnce({
        integrityHash: secondHash,
        traceEvents: [
          events[0],
          { ...events[1], location: 'Local adulterado' },
        ],
      });
    const service = new EventChainService(
      { batch: { findUnique } } as never,
      hashService,
    );

    await expect(service.verify('batch-1')).resolves.toMatchObject({
      valid: true,
      eventCount: 2,
      finalHash: secondHash,
    });
    const tampered = await service.verify('batch-1');
    expect(tampered.valid).toBe(false);
    expect(tampered.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'INVALID_EVENT_HASH', sequence: 2 }),
      ]),
    );
  });
});
