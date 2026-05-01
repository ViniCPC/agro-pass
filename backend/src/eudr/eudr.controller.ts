import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ListValidationsQueryDto } from './dto/list-validations-query.dto';
import { ListValidationsResponseDto } from './dto/list-validations-response.dto';
import { ValidateFarmDto } from './dto/validate-farm.dto';
import { EudrService } from './eudr.service';

@ApiTags('EUDR')
@Controller('eudr')
export class EudrController {
  constructor(private readonly eudrService: EudrService) {}

  @Post('farms/:farmId/validate')
  @ApiOperation({
    summary: 'Executa validacao EUDR de uma fazenda',
  })
  @ApiOkResponse({
    description:
      'Validacao executada com sucesso e status da fazenda atualizado.',
  })
  @ApiBadRequestResponse({
    description: 'Parametros invalidos para validacao EUDR.',
  })
  @ApiNotFoundResponse({
    description: 'Fazenda nao encontrada.',
  })
  validateFarm(
    @Param('farmId', new ParseUUIDPipe()) farmId: string,
    @Body() dto: ValidateFarmDto,
  ) {
    return this.eudrService.validateFarm(farmId, dto);
  }

  @Get('farms/:farmId/last-validation')
  @ApiOperation({
    summary: 'Retorna a ultima validacao EUDR da fazenda',
  })
  @ApiOkResponse({
    description: 'Ultima validacao encontrada (ou null quando inexistente).',
  })
  @ApiNotFoundResponse({
    description: 'Fazenda nao encontrada.',
  })
  getLastValidation(@Param('farmId', new ParseUUIDPipe()) farmId: string) {
    return this.eudrService.getLastValidation(farmId);
  }

  @Get('farms/:farmId/validations')
  @ApiOperation({
    summary: 'Lista o historico paginado de validacoes EUDR da fazenda',
  })
  @ApiOkResponse({
    description: 'Historico paginado de validacoes retornado com sucesso.',
    type: ListValidationsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Fazenda nao encontrada.',
  })
  getValidationHistory(
    @Param('farmId', new ParseUUIDPipe()) farmId: string,
    @Query() query: ListValidationsQueryDto,
  ) {
    return this.eudrService.getValidationHistory(
      farmId,
      query.page,
      query.limit,
    );
  }
}
