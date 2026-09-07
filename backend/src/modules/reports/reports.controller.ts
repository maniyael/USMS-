import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Permissions('report.view')
  summary() {
    return this.reportsService.summary();
  }

  @Get('enrollment-by-program')
  @Permissions('report.view')
  enrollmentByProgram(@Query('programId') programId?: string) {
    return this.reportsService.enrollmentByProgram(programId ? Number(programId) : undefined);
  }

  @Get('grade-distribution')
  @Permissions('report.view')
  gradeDistribution(@Query('courseId') courseId?: string) {
    return this.reportsService.gradeDistribution(courseId ? Number(courseId) : undefined);
  }
}