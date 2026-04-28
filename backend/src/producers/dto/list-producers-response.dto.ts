import { PaginationDto } from './pagination.dto';
import { ProducerDto } from './producer.dto';

export class ListProducersResponseDto {
  data!: ProducerDto[];
  pagination!: PaginationDto;
}
