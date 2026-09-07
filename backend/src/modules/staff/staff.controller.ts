import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateStaffDto, CourseAssignDto } from './dto/staff.dto';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UseGuards } from '@nestjs/common';

@Controller('staff')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Permissions('staff.view')
  list(@Query('departmentId') departmentId?: string) {
    return this.staffService.list().then((items) =>
      departmentId ? items.filter((s) => s.departmentId === Number(departmentId)) : items,
    );
  }

  @Get(':id')
  @Permissions('staff.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Post()
  @Permissions('staff.create')
  async create(@Body() dto: CreateStaffDto, @CurrentUser() user: { userId: number }) {
    const staff = await this.staffService.create(dto);
    await this.auditService.log({
      action: 'staff.created',
      entity: 'Staff',
      entityId: staff.id,
      userId: user.userId,
      details: { staffId: staff.staffId, email: staff.email },
    });
    return staff;
  }

  @Patch(':id')
  @Permissions('staff.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateStaffDto>,
    @CurrentUser() user: { userId: number },
  ) {
    const staff = await this.staffService.update(id, dto);
    await this.auditService.log({
      action: 'staff.updated',
      entity: 'Staff',
      entityId: id,
      userId: user.userId,
    });
    return staff;
  }

  // ---- Course assignments ----
  @Get('assignments/list')
  @Permissions('course.view', 'assignment.manage')
  listAssignments(
    @Query('staffId') staffId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    return this.staffService.listAssignments(
      staffId ? Number(staffId) : undefined,
      academicYear,
      semester ? Number(semester) : undefined,
    );
  }

  @Post('assignments')
  @Permissions('assignment.manage')
  async assignCourse(@Body() dto: CourseAssignDto, @CurrentUser() user: { userId: number }) {
    const assignment = await this.staffService.assignCourse(dto);
    await this.auditService.log({
      action: 'staff.course_assigned',
      entity: 'CourseAssignment',
      entityId: assignment.id,
      userId: user.userId,
      details: dto as unknown as Record<string, unknown>,
    });
    return assignment;
  }

  @Delete('assignments/:id')
  @Permissions('assignment.manage')
  async removeAssignment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    await this.staffService.removeAssignment(id);
    await this.auditService.log({
      action: 'staff.course_unassigned',
      entity: 'CourseAssignment',
      entityId: id,
      userId: user.userId,
    });
    return { message: 'Assignment removed' };
  }
}