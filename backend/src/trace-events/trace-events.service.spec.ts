import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BatchStatus, TraceEventType } from '../../generated/prisma/enums';
import { BatchLifecycleService } from '../batches/batch-lifecycle.service';
import { BatchAuthorizationService } from '../batches/batch-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventChainService } from '../event-chain/event-chain.service';
import { TraceEventsService } from './trace-events.service';

const ADMIN_USER = {
  sub: 'admin-uuid',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  producerId: null,
  cooperativeId: null,
} as const;

describe('TraceEventsService lifecycle guard', () => {
  let service: TraceEventsService;
  let batchFindUnique: jest.Mock;
  let appendEvent: jest.Mock;

  beforeEach(async () => {
    batchFindUnique = jest.fn();
    appendEvent = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        TraceEventsService,
        {
          provide: EventChainService,
          useValue: { append: appendEvent, verify: jest.fn() },
        },
        BatchLifecycleService,
        {
          provide: BatchAuthorizationService,
          useValue: { assertCanAddEvent: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            batch: { findUnique: batchFindUnique },
            document: { findUnique: jest.fn() },
            traceEvent: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(TraceEventsService);
  });

  it.each([BatchStatus.CLOSED, BatchStatus.CANCELLED])(
    'impede novos eventos em lote %s',
    async (status) => {
      batchFindUnique.mockResolvedValue({ id: 'batch-uuid', status });

      await expect(
        service.create(
          'batch-uuid',
          {
            type: TraceEventType.HARVESTED,
          },
          ADMIN_USER as never,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(appendEvent).not.toHaveBeenCalled();
    },
  );
});
