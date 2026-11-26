import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateProducerDto } from './dto/create-producer.dto';
import { ListProducersResponseDto } from './dto/list-producers-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ProducerDto } from './dto/producer.dto';
import { ProducersService } from './producers.service';
import { UserRole } from '../../generated/prisma/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.type';
import { AccessService } from '../access/access.service';

@Roles(UserRole.COOPERATIVE, UserRole.ADMIN)
@Controller('producers')
export class ProducersController {
  constructor(
    private readonly producersService: ProducersService,
    private readonly access: AccessService,
  ) {}

  @Post()
  create(
    @Body() createProducerDto: CreateProducerDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ProducerDto> {
    return this.producersService.create(
      createProducerDto,
      user.role === UserRole.COOPERATIVE ? user.cooperativeId : null,
      user.demoSessionId ?? null,
    );
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ListProducersResponseDto> {
    return this.producersService.findAll(
      query.page,
      query.limit,
      this.access.producerWhere(user),
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ProducerDto> {
    await this.access.assertProducer(id, user);
    return this.producersService.findOne(id);
  }
}
