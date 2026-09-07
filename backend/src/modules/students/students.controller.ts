import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../../common/services/audit.service';
import { GpaService } from '../../common/services/gpa.service';
import {
  CreateStudentDto,
  QueryStudentsDto,
  UpdateStudentDto,
} from './dto/students.dto';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly gpaService: GpaService,
    private readonly auditService: AuditService,
  ) {}

  @Get('dashboard-stats')
  @Permissions('student.view')
  dashboardStats() {
    return this.studentsService.getDashboardStats();
  }

  @Get()
  @Permissions('student.view')
  list(@Query() query: QueryStudentsDto) {
    return this.studentsService.list(query);
  }

  @Post()
  @Permissions('student.create')
  async create(@Body() dto: CreateStudentDto, @CurrentUser() user: { userId: number }) {
    const student = await this.studentsService.create(dto);
    await this.auditService.log({
      action: 'student.created',
      entity: 'Student',
      entityId: student.id,
      userId: user.userId,
      details: {
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        institutionalEmail: student.institutionalEmail,
      },
    });
    return student;
  }

  @Get(':id')
  @Permissions('student.view')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; roleName?: string; linkedStudentId?: number },
  ) {
    await this.assertCanViewStudent(id, user);
    const student = await this.studentsService.findById(id);
    const summary = await this.gpaService.computeStudentSummary(id);
    return { student, summary };
  }

  @Patch(':id')
  @Permissions('student.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: { userId: number },
  ) {
    const updated = await this.studentsService.update(id, dto);
    await this.auditService.log({
      action: 'student.updated',
      entity: 'Student',
      entityId: id,
      userId: user.userId,
      details: { ...dto } as Record<string, unknown>,
    });
    return updated;
  }

  @Patch(':id/status')
  @Permissions('student.update')
  async setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { academicStatus: string },
    @CurrentUser() user: { userId: number },
  ) {
    const updated = await this.studentsService.setAcademicStatus(
      id,
      body.academicStatus as never,
    );
    await this.auditService.log({
      action: 'student.status_changed',
      entity: 'Student',
      entityId: id,
      userId: user.userId,
      details: { academicStatus: body.academicStatus },
    });
    return updated;
  }

  @Delete(':id')
  @Permissions('student.update')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    await this.studentsService.remove(id);
    await this.auditService.log({
      action: 'student.withdrawn',
      entity: 'Student',
      entityId: id,
      userId: user.userId,
      details: { note: 'Soft removal: student ID is never recycled' },
    });
    return { message: 'Student record marked as withdrawn' };
  }

  private async assertCanViewStudent(
    id: number,
    user: { userId: number; roleName?: string; linkedStudentId?: number },
  ): Promise<void> {
    if (user.roleName === 'student') {
      if (user.linkedStudentId !== id) {
        throw new ForbiddenException('You can only access your own record');
      }
    }
  }
}