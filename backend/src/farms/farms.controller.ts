import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CreateFarmDto } from './dto/create-farm.dto';
import { FarmDto } from './dto/farm.dto';
import { ListFarmsResponseDto } from './dto/list-farms-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { FarmsService } from './farms.service';
import { UserRole } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  create(
    @Body() createFarmDto: CreateFarmDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FarmDto> {
    return this.farmsService.create(createFarmDto, user);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<ListFarmsResponseDto> {
    return this.farmsService.findAll(query.page, query.limit);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<FarmDto> {
    return this.farmsService.findOne(id);
  }

}
