import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import { NotFoundException } from '@nestjs/common';
import { FILE_STORAGE } from '../storage/file-storage';
import type { FileStorage } from '../storage/file-storage';
import { UserRole } from '../../generated/prisma/enums';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  BatchTokenizationService,
  type TokenizationResult,
} from '../blockchain/batch-tokenization.service';
import { BatchDocumentsService } from './batch-documents.service';
import { BatchQrCodeService } from './batch-qrcode.service';
import { BatchesService } from './batches.service';
import { BatchDto } from './dto/batch.dto';
import { CancelBatchDto } from './dto/cancel-batch.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { DocumentDto } from './dto/document.dto';
import { ListBatchesResponseDto } from './dto/list-batches-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';
import { UpdateBatchVisibilityDto } from './dto/update-batch-visibility.dto';
import { UpdateDocumentVisibilityDto } from './dto/update-document-visibility.dto';
import { UPLOAD_LIMITS } from './document-upload.constants';

@Controller('batches')
export class BatchesController {
  constructor(
    private readonly batchesService: BatchesService,
    private readonly batchDocumentsService: BatchDocumentsService,
    private readonly batchQrCodeService: BatchQrCodeService,
    private readonly tokenization: BatchTokenizationService,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStorage,
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
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
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

  @Get(':id/documents/:documentId/file')
  @Roles(UserRole.COOPERATIVE, UserRole.ADMIN)
  async downloadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    const document = await this.batchDocumentsService.getPrivateFile(
      id,
      documentId,
      user,
    );

    let buffer: Buffer;

    try {
      // The local provider still refuses keys outside the uploads folder.
      buffer = await this.fileStorage.download(document.storageKey);
    } catch {
      throw new NotFoundException('Arquivo indisponivel.');
    }

    response.setHeader('Content-Type', document.mimeType);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Content-Disposition', 'attachment');

    return response.send(buffer);
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
    @Body() dto: CancelBatchDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BatchDto> {
    return this.batchesService.cancel(id, user, dto);
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

  // Closing a batch already registers its proof in the background; this
  // endpoint retries after a failure. Idempotent: a confirmed batch returns
  // its existing proof and is never minted twice.
  @Post(':id/tokenize')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  tokenize(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TokenizationResult> {
    return this.tokenization.tokenize(id);
  }
}
