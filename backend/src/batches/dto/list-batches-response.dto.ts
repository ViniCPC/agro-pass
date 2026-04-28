import { BatchDto } from './batch.dto';
import { PaginationDto } from './pagination.dto';

export class ListBatchesResponseDto {
  data!: BatchDto[];
  pagination!: PaginationDto;
}
