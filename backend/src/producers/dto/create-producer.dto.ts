import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class CreateProducerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'O telefone deve ter exatamente 11 dígitos numéricos' })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d{11}|\d{14})$/, { message: 'O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)' })
  document!: string;
}
