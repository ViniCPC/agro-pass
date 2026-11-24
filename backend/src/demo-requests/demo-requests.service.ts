import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';

const LIST_LIMIT = 100;

@Injectable()
export class DemoRequestsService {
  private readonly logger = new Logger(DemoRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDemoRequestDto) {
    const created = await this.prisma.demoRequest.create({
      data: {
        name: dto.name,
        company: dto.company,
        email: dto.email,
        phone: dto.phone ?? null,
        profile: dto.profile,
        consentAt: new Date(),
      },
      select: { id: true, createdAt: true },
    });

    // Contact data stays in the database, never in the logs.
    this.logger.log({
      event: 'demo_request_received',
      id: created.id,
      profile: dto.profile,
    });

    return { id: created.id, receivedAt: created.createdAt };
  }

  list() {
    return this.prisma.demoRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
    });
  }
}
