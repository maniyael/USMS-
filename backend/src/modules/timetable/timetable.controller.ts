import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import type { CreateTimetableEntryDto } from './timetable.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('timetable')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimetableController {
  constructor(
    private readonly timetableService: TimetableService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Permissions('timetable.manage')
  async create(
    @Body() dto: CreateTimetableEntryDto,
    @CurrentUser() user: { userId: number },
  ) {
    const entry = await this.timetableService.create(dto);
    await this.auditService.log({
      action: 'timetable.created',
      entity: 'TimetableEntry',
      entityId: entry.id,
      userId: user.userId,
      details: dto as unknown as Record<string, unknown>,
    });
    return entry;
  }

  @Get()
  @Permissions('timetable.view')
  list(
    @Query('courseId') courseId?: string,
    @Query('levelId') levelId?: string,
  ) {
    return this.timetableService.list({
      courseId: courseId ? Number(courseId) : undefined,
      levelId: levelId ? Number(levelId) : undefined,
    });
  }

  @Get('day')
  @Permissions('timetable.view')
  getDay(
    @Query('academicYear') academicYear: string,
    @Query('semester') semester: string,
    @Query('day') day: string,
  ) {
    return this.timetableService.getDay(academicYear, Number(semester), Number(day));
  }

  @Delete(':id')
  @Permissions('timetable.manage')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    const result = await this.timetableService.remove(id);
    await this.auditService.log({
      action: 'timetable.deleted',
      entity: 'TimetableEntry',
      entityId: id,
      userId: user.userId,
    });
    return result;
  }
}