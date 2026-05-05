class ImportCountersDto {
  created!: number;
  updated!: number;
}

class ImportRowErrorDto {
  row!: number;
  reason!: string;
}

export class ImportProducersResponseDto {
  cooperativeId!: string;
  producers!: ImportCountersDto;
  farms!: ImportCountersDto;
  skippedRows!: number;
  errors!: ImportRowErrorDto[];
}
