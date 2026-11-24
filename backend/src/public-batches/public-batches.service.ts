import { Injectable, NotFoundException } from '@nestjs/common';
import { TraceEventType } from '../../generated/prisma/enums';
import type { DocumentType, UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { EventChainService } from '../event-chain/event-chain.service';
import { explorerAddressUrl, explorerTxUrl } from '../blockchain/explorer';

// Public coordinates keep ~1 km of precision: enough to show the region of
// origin without pinpointing the producer's property.
const PUBLIC_COORDINATE_DECIMALS = 2;

const DOCUMENT_SELECT = {
  id: true,
  type: true,
  originalName: true,
  fileUrl: true,
  size: true,
  mimeType: true,
  fileHash: true,
  isPublic: true,
  createdAt: true,
} as const;

interface DocumentRecord {
  id: string;
  type: DocumentType;
  originalName: string;
  fileUrl: string;
  size: number;
  mimeType: string;
  fileHash: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface PublicDocument {
  id: string;
  type: DocumentType;
  isPublic: boolean;
  originalName: string | null;
  fileUrl: string | null;
  size: number;
  mimeType: string;
  fileHash: string;
  createdAt: Date;
}

interface EventRecord {
  id: string;
  type: TraceEventType;
  sequence: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  previousHash: string | null;
  eventHash: string;
  txHash: string | null;
  recordedBy: { name: string; role: UserRole };
  recordedAt: Date;
  correctedEventId: string | null;
  documents: DocumentRecord[];
}

function roundCoordinate(value: number | null): number | null {
  if (value == null) return null;
  const factor = 10 ** PUBLIC_COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

// A restricted document keeps its hash, which proves the evidence exists and
// was not altered, but never its file name or download link.
function toPublicDocument(document: DocumentRecord): PublicDocument {
  return {
    id: document.id,
    type: document.type,
    isPublic: document.isPublic,
    originalName: document.isPublic ? document.originalName : null,
    fileUrl: document.isPublic ? document.fileUrl : null,
    size: document.size,
    mimeType: document.mimeType,
    fileHash: document.fileHash,
    createdAt: document.createdAt,
  };
}

function toPublicEvent(event: EventRecord) {
  const documents = event.documents.map(toPublicDocument);
  // The system note of an attachment event embeds the original file name,
  // so it is withheld while any attached file is restricted.
  const hidesNotes =
    event.type === TraceEventType.DOCUMENT_ATTACHED &&
    documents.some((document) => !document.isPublic);
  const notes = hidesNotes ? null : event.notes;

  return {
    id: event.id,
    type: event.type,
    sequence: event.sequence,
    location: event.location,
    latitude: roundCoordinate(event.latitude),
    longitude: roundCoordinate(event.longitude),
    notes,
    previousHash: event.previousHash,
    eventHash: event.eventHash,
    txHash: event.txHash,
    recordedAt: event.recordedAt,
    correctedEventId: event.correctedEventId,
    actor: { name: event.recordedBy.name, role: event.recordedBy.role },
    documents,

    // Aliases kept for clients of the previous payload.
    actorName: event.recordedBy.name,
    createdAt: event.recordedAt,
    customStageName: notes,
    documentId: documents[0]?.id ?? null,
    document: documents[0] ?? null,
  };
}

@Injectable()
export class PublicBatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventChain: EventChainService,
  ) {}

  async verifyIntegrity(code: string) {
    const batch = await this.prisma.batch.findFirst({
      where: { publicCode: code, isPublic: true },
      select: { id: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote nao encontrado');
    }

    return this.eventChain.verify(batch.id);
  }

  async findByCode(code: string) {
    const batch = await this.prisma.batch.findFirst({
      where: {
        publicCode: code,
        isPublic: true,
      },
      select: {
        id: true,
        code: true,
        productType: true,
        quantity: true,
        unit: true,
        harvestDate: true,
        status: true,
        publicCode: true,
        isPublic: true,
        integrityHash: true,
        tokenizationStatus: true,
        proofHash: true,
        tokenAddress: true,
        tokenTxHash: true,
        tokenizedAt: true,
        blockchainNetwork: true,
        closedAt: true,
        createdAt: true,
        updatedAt: true,

        farm: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
            carNumber: true,
            totalAreaHa: true,
            producer: { select: { name: true } },
          },
        },

        traceEvents: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            type: true,
            sequence: true,
            location: true,
            latitude: true,
            longitude: true,
            notes: true,
            previousHash: true,
            eventHash: true,
            txHash: true,
            recordedBy: { select: { name: true, role: true } },
            recordedAt: true,
            correctedEventId: true,
            documents: { select: DOCUMENT_SELECT },
          },
        },

        documents: {
          orderBy: { createdAt: 'desc' },
          select: DOCUMENT_SELECT,
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Lote não encontrado');
    }

    const [farmDocuments, integrity] = await Promise.all([
      this.prisma.document.findMany({
        where: { farmId: batch.farm.id },
        orderBy: { createdAt: 'desc' },
        select: DOCUMENT_SELECT,
      }),
      this.eventChain.verify(batch.id),
    ]);

    const documents = [
      ...batch.documents.map((document) => ({
        ...toPublicDocument(document),
        scope: 'BATCH' as const,
      })),
      ...farmDocuments.map((document) => ({
        ...toPublicDocument(document),
        scope: 'FARM' as const,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      batch: {
        id: batch.id,
        code: batch.code,
        productType: batch.productType,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        status: batch.status,
        publicCode: batch.publicCode,
        isPublic: batch.isPublic,
        integrityHash: batch.integrityHash,
        closedAt: batch.closedAt,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
      },

      // proofHash is the exact value anchored on-chain (it is also in the
      // transaction memo), so the passport can compare it with the chain.
      blockchain: {
        status: batch.tokenizationStatus,
        network: batch.blockchainNetwork,
        proofHash: batch.proofHash,
        tokenAddress: batch.tokenAddress,
        txHash: batch.tokenTxHash,
        tokenizedAt: batch.tokenizedAt,
        explorerTxUrl: explorerTxUrl(
          batch.blockchainNetwork,
          batch.tokenTxHash,
        ),
        explorerTokenUrl: explorerAddressUrl(
          batch.blockchainNetwork,
          batch.tokenAddress,
        ),
      },

      farm: {
        name: batch.farm.name,
        city: batch.farm.city,
        state: batch.farm.state,
        latitude: roundCoordinate(batch.farm.latitude),
        longitude: roundCoordinate(batch.farm.longitude),
        carNumber: batch.farm.carNumber,
        totalAreaHa: batch.farm.totalAreaHa,
        producer: { name: batch.farm.producer.name },
      },

      traceEvents: batch.traceEvents.map(toPublicEvent),

      documents,

      integrity: {
        valid: integrity.valid,
        eventCount: integrity.eventCount,
        finalHash: integrity.finalHash,
        checkedAt: new Date(),
        errors: integrity.errors,
      },
    };
  }
}
