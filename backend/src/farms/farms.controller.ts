import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateFarmDto } from './dto/create-farm.dto';
import { FarmDto } from './dto/farm.dto';
import { ListFarmsResponseDto } from './dto/list-farms-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateFarmStatusDto } from './dto/update-farm-status.dto';
import { FarmsService } from './farms.service';

@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  create(@Body() createFarmDto: CreateFarmDto): Promise<FarmDto> {
    return this.farmsService.create(createFarmDto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<ListFarmsResponseDto> {
    return this.farmsService.findAll(query.page, query.limit);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<FarmDto> {
    return this.farmsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateFarmStatusDto: UpdateFarmStatusDto,
  ): Promise<FarmDto> {
    return this.farmsService.updateStatus(id, updateFarmStatusDto);
  }
}
