import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchDto } from './dto/batch.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { ListBatchesResponseDto } from './dto/list-batches-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(@Body() createBatchDto: CreateBatchDto): Promise<BatchDto> {
    return this.batchesService.create(createBatchDto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<ListBatchesResponseDto> {
    return this.batchesService.findAll(query.page, query.limit);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<BatchDto> {
    return this.batchesService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateBatchStatusDto: UpdateBatchStatusDto,
  ): Promise<BatchDto> {
    return this.batchesService.updateStatus(id, updateBatchStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.batchesService.remove(id);
  }
}
