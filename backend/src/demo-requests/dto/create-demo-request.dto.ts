import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsEmpty,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { DemoRequestProfile } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDemoRequestDto {
  @Transform(trim)
  @IsString()
  @Length(2, 120)
  name!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 160)
  company!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  @MaxLength(254)
  email!: string;

  // Optional: an empty field counts as not informed.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : trim({ value }),
  )
  @IsOptional()
  @Matches(/^[0-9+()\-\s]{8,30}$/, { message: 'Informe um telefone valido.' })
  phone?: string;

  @IsEnum(DemoRequestProfile)
  profile!: DemoRequestProfile;

  @Equals(true, { message: 'E necessario autorizar o contato.' })
  consent!: boolean;

  // Honeypot: hidden from people, filled in by naive bots.
  @IsOptional()
  @IsEmpty({ message: 'Requisicao recusada.' })
  website?: string;
}
