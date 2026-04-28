import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CreateProducerDto } from './dto/create-producer.dto';
import { ListProducersResponseDto } from './dto/list-producers-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ProducerDto } from './dto/producer.dto';
import { ProducersService } from './producers.service';

@Controller('producers')
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Post()
  create(@Body() createProducerDto: CreateProducerDto): Promise<ProducerDto> {
    return this.producersService.create(createProducerDto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<ListProducersResponseDto> {
    return this.producersService.findAll(query.page, query.limit);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProducerDto> {
    return this.producersService.findOne(id);
  }
}
