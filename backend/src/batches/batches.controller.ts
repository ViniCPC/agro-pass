import {
  Body,
  Controller,
  Get,
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
import { UserRole } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { BubblegumService } from '../solana/bubblegum/bubblegum.service';
import { BatchDocumentsService } from './batch-documents.service';
import { BatchQrCodeService } from './batch-qrcode.service';
import { BatchesService } from './batches.service';
import { BatchDto } from './dto/batch.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { DocumentDto } from './dto/document.dto';
import { ListBatchesResponseDto } from './dto/list-batches-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';
import { UpdateBatchVisibilityDto } from './dto/update-batch-visibility.dto';
import { UpdateDocumentVisibilityDto } from './dto/update-document-visibility.dto';

@Controller('batches')
export class BatchesController {
  constructor(
    private readonly batchesService: BatchesService,
    private readonly batchDocumentsService: BatchDocumentsService,
    private readonly batchQrCodeService: BatchQrCodeService,
    private readonly bubblegumService: BubblegumService,
  ) {}

  @Post()
  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  create(
    @Body() createBatchDto: CreateBatchDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BatchDto> {
    return this.batchesService.create(createBatchDto, user);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto): Promise<ListBatchesResponseDto> {
    return this.batchesService.findAll(query.page, query.limit);
  }

  @Get(':id/transitions')
  getAllowedTransitions(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.batchesService.getAllowedTransitions(id);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<BatchDto> {
    return this.batchesService.findOne(id);
  }

  @Post(':id/documents')
  @Roles(UserRole.COOPERATIVE, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  addDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ): Promise<DocumentDto> {
    return this.batchDocumentsService.addDocument(
      id,
      uploadDocumentDto,
      user,
      file,
    );
  }

  @Get(':id/documents')
  findDocuments(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<DocumentDto[]> {
    return this.batchDocumentsService.findDocuments(id);
  }

  @Patch(':id/documents/:documentId/visibility')
  @Roles(UserRole.COOPERATIVE, UserRole.ADMIN)
  updateDocumentVisibility(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body() dto: UpdateDocumentVisibilityDto,
    @CurrentUser() user: AuthUser,
  ): Promise<DocumentDto> {
    return this.batchDocumentsService.updateVisibility(
      id,
      documentId,
      dto.isPublic,
      user,
    );
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

  @Patch(':id/status')
  @Roles(
    UserRole.PRODUCER,
    UserRole.COOPERATIVE,
    UserRole.OPERATOR,
    UserRole.ADMIN,
  )
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateBatchStatusDto: UpdateBatchStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BatchDto> {
    return this.batchesService.updateStatus(id, updateBatchStatusDto, user);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<BatchDto> {
    return this.batchesService.cancel(id, user);
  }

  @Patch(':id/close')
  @Roles(UserRole.ADMIN)
  close(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<BatchDto> {
    return this.batchesService.close(id, user);
  }

  @Patch(':id/visibility')
  @Roles(UserRole.ADMIN)
  updateVisibility(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBatchVisibilityDto,
  ): Promise<BatchDto> {
    return this.batchesService.updateVisibility(id, dto);
  }

  @Post(':id/mint')
  @Roles(UserRole.ADMIN)
  async mintBatch(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bubblegumService.mintBatchCnft(id, user);
  }
}
