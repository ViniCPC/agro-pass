import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateFarmDto } from './dto/create-farm.dto';
import { FarmDto } from './dto/farm.dto';
import { ListFarmsResponseDto } from './dto/list-farms-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { FarmsService } from './farms.service';
import { UserRole } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AccessService } from '../access/access.service';

@Controller('farms')
export class FarmsController {
  constructor(
    private readonly farmsService: FarmsService,
    private readonly access: AccessService,
  ) {}

  @Post()
  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  async create(
    @Body() createFarmDto: CreateFarmDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FarmDto> {
    // The owner must be a producer this user can see (own account, or for an
    // admin, one of the same real or demo data set).
    await this.access.assertProducer(createFarmDto.producerId, user);
    return this.farmsService.create(createFarmDto, user);
  }

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ListFarmsResponseDto> {
    return this.farmsService.findAll(
      query.page,
      query.limit,
      this.access.farmWhere(user),
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<FarmDto> {
    await this.access.assertFarm(id, user);
    return this.farmsService.findOne(id);
  }
}
