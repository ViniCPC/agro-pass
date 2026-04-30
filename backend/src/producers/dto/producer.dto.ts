import type { Producer } from '../../../generated/prisma/client';

export class ProducerDto {
  id!: string;
  name!: string;
  phone!: string;
  document!: string | null;
  createdAt!: Date;

  static fromModel(producer: Producer): ProducerDto {
    return {
      id: producer.id,
      name: producer.name,
      phone: producer.phone,
      document: producer.document,
      createdAt: producer.createdAt,
    };
  }
}
