import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { DocumentType } from '../../../generated/prisma/enums';

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;

  // Multipart fields arrive as strings ("true"/"false").
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isPublic?: boolean;
}
