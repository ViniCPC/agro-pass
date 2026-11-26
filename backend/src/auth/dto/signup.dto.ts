import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const digitsOnly = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\D/g, '') : value;

// Self-service sign-up: always a producer account, created together with its
// producer record. Cooperative, operator and admin accounts are provisioned,
// never chosen by whoever fills the form.
export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @Transform(digitsOnly)
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'O telefone deve ter DDD e 9 dígitos (11 números).',
  })
  phone!: string;

  @Transform(digitsOnly)
  @IsString()
  @Matches(/^(\d{11}|\d{14})$/, {
    message: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).',
  })
  document!: string;

  // Links the producer to the cooperative that invited them, so it can record
  // the stages after the harvest.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsOptional()
  @IsUUID('all', { message: 'Código de convite inválido.' })
  inviteCode?: string;
}
