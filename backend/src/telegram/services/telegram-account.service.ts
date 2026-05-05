import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type LinkResult =
  | { status: 'success'; producerName: string }
  | { status: 'already_linked'; producerName: string }
  | { status: 'not_found' }
  | { status: 'ambiguous' }
  | { status: 'phone_conflict' }
  | { status: 'telegram_conflict'; existingProducerName: string };

export type LinkByDocumentResult =
  | { status: 'success'; producerName: string }
  | { status: 'already_linked'; producerName: string }
  | { status: 'not_found' }
  | { status: 'document_conflict' }
  | { status: 'telegram_conflict'; existingProducerName: string }
  | { status: 'invalid_document' };

@Injectable()
export class TelegramAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTelegramId(telegramUserId: string) {
    return this.prisma.producer.findUnique({ where: { telegramUserId } });
  }

  async findProducerByTelegramId(telegramUserId: string) {
    return this.findByTelegramId(telegramUserId);
  }

  async linkAccount(
    telegramUserId: string,
    rawPhone: string,
  ): Promise<LinkResult> {
    const phone = this.normalizePhone(rawPhone);
    const matches = await this.prisma.producer.findMany({ where: { phone } });

    if (matches.length === 0) return { status: 'not_found' };
    if (matches.length > 1) return { status: 'ambiguous' };

    const producer = matches[0];

    if (producer.telegramUserId === telegramUserId) {
      return { status: 'already_linked', producerName: producer.name };
    }

    if (producer.telegramUserId) {
      return { status: 'phone_conflict' };
    }

    const existingLink = await this.prisma.producer.findUnique({
      where: { telegramUserId },
    });
    if (existingLink) {
      return {
        status: 'telegram_conflict',
        existingProducerName: existingLink.name,
      };
    }

    await this.prisma.producer.update({
      where: { id: producer.id },
      data: { telegramUserId },
    });

    return { status: 'success', producerName: producer.name };
  }

  async linkProducerByDocument(input: {
    telegramUserId: string;
    document: string;
    cooperativeInviteCode: string;
  }): Promise<LinkByDocumentResult> {
    const document = this.normalizeDocument(input.document);

    if (!this.isValidDocumentLength(document)) {
      return { status: 'invalid_document' };
    }

    const cooperative = await this.prisma.cooperative.findUnique({
      where: { inviteCode: input.cooperativeInviteCode },
      select: { id: true },
    });

    if (!cooperative) {
      return { status: 'not_found' };
    }

    const producer = await this.prisma.producer.findFirst({
      where: {
        document,
        cooperativeId: cooperative.id,
      },
    });

    if (!producer) {
      return { status: 'not_found' };
    }

    if (producer.telegramUserId === input.telegramUserId) {
      return { status: 'already_linked', producerName: producer.name };
    }

    if (producer.telegramUserId) {
      return { status: 'document_conflict' };
    }

    const existingLink = await this.prisma.producer.findUnique({
      where: { telegramUserId: input.telegramUserId },
    });

    if (existingLink) {
      return {
        status: 'telegram_conflict',
        existingProducerName: existingLink.name,
      };
    }

    await this.prisma.producer.update({
      where: { id: producer.id },
      data: { telegramUserId: input.telegramUserId },
    });

    return { status: 'success', producerName: producer.name };
  }

  normalizePhone(raw: string): string {
    return raw.replace(/\D/g, '');
  }

  normalizeDocument(raw: string): string {
    return raw.replace(/\D/g, '');
  }

  isValidPhoneLength(phone: string): boolean {
    return phone.length >= 10 && phone.length <= 11;
  }

  isValidDocumentLength(document: string): boolean {
    return document.length === 11 || document.length === 14;
  }
}
