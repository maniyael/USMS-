import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import type { DocumentType } from './entities/student-document.entity';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly auditService: AuditService,
  ) {}

  @Post('generate')
  @Permissions('document.generate')
  async generate(
    @Body() dto: { studentId: number; documentType: DocumentType },
    @CurrentUser() user: { userId: number },
  ) {
    const doc = await this.documentsService.generate(
      dto.studentId,
      dto.documentType,
      user.userId,
    );
    await this.auditService.log({
      action: 'document.generated',
      entity: 'StudentDocument',
      entityId: doc.id,
      userId: user.userId,
      details: dto as unknown as Record<string, unknown>,
    });
    return doc;
  }

  @Get()
  @Permissions('document.view')
  list(
    @Query('studentId') studentId?: string,
    @Query('documentType') documentType?: string,
  ) {
    return this.documentsService.list({
      studentId: studentId ? Number(studentId) : undefined,
      documentType: documentType as DocumentType | undefined,
    });
  }

  @Get(':id')
  @Permissions('document.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }
}
