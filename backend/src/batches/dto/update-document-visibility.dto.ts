import { IsBoolean } from 'class-validator';

export class UpdateDocumentVisibilityDto {
  @IsBoolean()
  isPublic!: boolean;
}
