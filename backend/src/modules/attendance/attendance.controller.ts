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
import { AttendanceService } from './attendance.service';
import type { SaveAttendanceDto } from './attendance.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Permissions('attendance.manage')
  async save(@Body() dto: SaveAttendanceDto, @CurrentUser() user: { userId: number }) {
    const result = await this.attendanceService.saveAttendance(dto, user.userId);
    await this.auditService.log({
      action: 'attendance.saved',
      entity: 'Attendance',
      userId: user.userId,
      details: {
        courseId: dto.courseId,
        date: dto.date,
        entries: dto.entries.length,
      },
    });
    return result;
  }

  @Get('course/:courseId')
  @Permissions('attendance.view')
  getByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.attendanceService.getByCourse(courseId);
  }

  @Get('course/:courseId/date/:date')
  @Permissions('attendance.view')
  getByCourseAndDate(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('date') date: string,
  ) {
    return this.attendanceService.getByCourseAndDate(courseId, date);
  }

  @Get('course/:courseId/dates')
  @Permissions('attendance.view')
  listDates(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.attendanceService.listClassDates(courseId);
  }

  @Get('course/:courseId/stats')
  @Permissions('attendance.view')
  stats(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.attendanceService.stats(courseId);
  }

  @Get('course/:courseId/student/:studentId')
  @Permissions('attendance.view')
  studentInCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.attendanceService.computePercentage(courseId, studentId);
  }

  @Get('student/:studentId')
  @Permissions('attendance.view')
  getByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.attendanceService.getByStudent(studentId);
  }
}