import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import type { EnrollStudentsDto } from './enrollment.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('enrollment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EnrollmentController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Permissions('enrollment.view')
  list(
    @Query('programId') programId?: string,
    @Query('levelId') levelId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
    @Query('courseId') courseId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.enrollmentService.list(
      programId ? Number(programId) : undefined,
      levelId ? Number(levelId) : undefined,
      academicYear,
      semester ? Number(semester) : undefined,
      courseId ? Number(courseId) : undefined,
      studentId ? Number(studentId) : undefined,
    );
  }

  @Get('my')
  @Permissions('enrollment.view')
  async myCourses(
    @CurrentUser() user: { userId: number; linkedStudentId?: number },
  ) {
    if (!user.linkedStudentId) {
      throw new ForbiddenException('You are not linked to a student profile');
    }
    return this.enrollmentService.myCourses(user.linkedStudentId);
  }

  @Post()
  @Permissions('enrollment.manage')
  async enrollStudents(
    @Body() dto: EnrollStudentsDto,
    @CurrentUser() user: { userId: number },
  ) {
    const result = await this.enrollmentService.enrollStudents(dto);
    await this.auditService.log({
      action: 'enrollment.created',
      entity: 'Enrollment',
      userId: user.userId,
      details: dto as unknown as Record<string, unknown>,
    });
    return result;
  }

  @Post('retake')
  @Permissions('enrollment.manage')
  async retake(
    @Body() dto: { studentId: number; courseId: number; academicYear: string; semester: number },
    @CurrentUser() user: { userId: number },
  ) {
    const enrollment = await this.enrollmentService.enrollRetake(
      dto.studentId,
      dto.courseId,
      dto.academicYear,
      dto.semester,
    );
    await this.auditService.log({
      action: 'enrollment.retake_created',
      entity: 'Enrollment',
      entityId: enrollment.id,
      userId: user.userId,
      details: dto as unknown as Record<string, unknown>,
    });
    return enrollment;
  }
}