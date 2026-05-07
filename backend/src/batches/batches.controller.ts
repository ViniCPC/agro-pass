import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { BubblegumService } from '../solana/bubblegum/bubblegum.service';
import { BatchDocumentsService } from './batch-documents.service';
import { BatchQrCodeService } from './batch-qrcode.service';
import { BatchValidationService } from './batch-validation.service';
import { BatchesService } from './batches.service';
import { BatchDto } from './dto/batch.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { DocumentDto } from './dto/document.dto';
import { ListBatchesResponseDto } from './dto/list-batches-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';
import { ValidateBatchResponseDto } from './dto/validate-batch-response.dto';

@Controller('batches')
export class BatchesController {
  constructor(
    private readonly batchesService: BatchesService,
    private readonly batchDocumentsService: BatchDocumentsService,
    private readonly batchValidationService: BatchValidationService,
    private readonly batchQrCodeService: BatchQrCodeService,
    private readonly bubblegumService: BubblegumService,
  ) {}

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

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  addDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentDto> {
    return this.batchDocumentsService.addDocument(id, uploadDocumentDto, file);
  }

  @Get(':id/documents')
  findDocuments(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<DocumentDto[]> {
    return this.batchDocumentsService.findDocuments(id);
  }

  @Post(':id/qrcode')
  generateQrCode(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.batchQrCodeService.generateQrCode(id);
  }

  @Get(':id/qrcode/print-sheet')
  async downloadQrPrintSheet(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('copies') copies: string | undefined,
    @Res() res: Response,
  ) {
    const parsedCopies = Number(copies ?? 8);
    const pdfBuffer = await this.batchQrCodeService.generatePrintSheetPdf(
      id,
      parsedCopies,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="batch-${id}-qr-sheet.pdf"`,
    );
    res.send(pdfBuffer);
  }

  @Patch(':id/validate')
  validateBatch(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ValidateBatchResponseDto> {
    return this.batchValidationService.validateBatch(id);
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

  @Post(':id/mint')
  async mintBatch(@Param('id') id: string) {
    return this.bubblegumService.mintBatchCnft(id);
  }
}
