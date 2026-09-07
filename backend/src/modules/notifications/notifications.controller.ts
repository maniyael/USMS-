import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService, CreateAnnouncementDto } from './notifications.service';
import type { CreateAnnouncementDto as AnnouncementType } from './notifications.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AnnouncementTargetType } from './entities/announcement.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  @Post('announcements')
  @Permissions('announcement.manage')
  async create(
    @Body() dto: AnnouncementType,
    @CurrentUser() user: { userId: number },
  ) {
    const announcement = await this.notificationsService.create(dto, user.userId);
    await this.auditService.log({
      action: 'announcement.created',
      entity: 'Announcement',
      entityId: announcement.id,
      userId: user.userId,
      details: { title: dto.title, targetType: dto.targetType },
    });
    return announcement;
  }

  @Get('announcements')
  @Permissions('announcement.view')
  list(
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('active') active?: string,
  ) {
    return this.notificationsService.list({
      targetType: targetType as AnnouncementTargetType | undefined,
      targetId: targetId ? Number(targetId) : undefined,
      active: active === 'true',
    });
  }

  @Get('announcements/:id')
  @Permissions('announcement.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.findOne(id);
  }

  @Put('announcements/:id')
  @Permissions('announcement.manage')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<AnnouncementType>,
    @CurrentUser() user: { userId: number },
  ) {
    const announcement = await this.notificationsService.update(id, dto);
    await this.auditService.log({
      action: 'announcement.updated',
      entity: 'Announcement',
      entityId: id,
      userId: user.userId,
    });
    return announcement;
  }

  @Delete('announcements/:id')
  @Permissions('announcement.manage')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    const result = await this.notificationsService.remove(id);
    await this.auditService.log({
      action: 'announcement.deleted',
      entity: 'Announcement',
      entityId: id,
      userId: user.userId,
    });
    return result;
  }

  @Get('student/:studentId')
  @Permissions('announcement.view')
  forStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('facultyId') facultyId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('programId') programId?: string,
    @Query('levelId') levelId?: string,
    @Query('cohortId') cohortId?: string,
  ) {
    return this.notificationsService.forStudent(studentId, {
      facultyId: facultyId ? Number(facultyId) : undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
      programId: programId ? Number(programId) : undefined,
      levelId: levelId ? Number(levelId) : undefined,
      cohortId: cohortId ? Number(cohortId) : undefined,
    });
  }
}
