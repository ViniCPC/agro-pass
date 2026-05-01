import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum EudrValidationMode {
  MOCK = 'MOCK',
  SEMI_AUTOMATIC = 'SEMI_AUTOMATIC',
}

export class ValidateFarmDto {
  @ApiPropertyOptional({
    enum: EudrValidationMode,
    description: 'Modo da validacao EUDR. O padrao e SEMI_AUTOMATIC.',
  })
  @IsOptional()
  @IsEnum(EudrValidationMode)
  mode?: EudrValidationMode;

  @ApiPropertyOptional({
    minimum: 0,
    description:
      'Valor usado apenas no modo MOCK para simular hectares desmatados.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mockHectaresDeforested?: number;

  @ApiPropertyOptional({
    description: 'Observacoes livres para auditoria manual.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
