import { IsEnum } from 'class-validator';
import { DocumentType } from '../../../generated/prisma/enums';

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;
}
