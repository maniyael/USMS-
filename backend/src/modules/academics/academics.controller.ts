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
import { AcademicsService } from './academics.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CreateAcademicYearDto,
  CreateCohortDto,
  CreateDepartmentDto,
  CreateFacultyDto,
  CreateLevelDto,
  CreateProgramDto,
} from './dto/academics.dto';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('academics')
export class AcademicsController {
  constructor(
    private readonly academicsService: AcademicsService,
    private readonly auditService: AuditService,
  ) {}

  // ---- Faculties ----
  @Get('faculties')
  @Permissions('academic.view')
  listFaculties() {
    return this.academicsService.listFaculties();
  }

  @Post('faculties')
  @Permissions('academic.create')
  async createFaculty(@Body() dto: CreateFacultyDto, @CurrentUser() user: { userId: number }) {
    const faculty = await this.academicsService.createFaculty(dto);
    await this.auditService.log({
      action: 'faculty.created',
      entity: 'Faculty',
      entityId: faculty.id,
      userId: user.userId,
      details: { name: faculty.name },
    });
    return faculty;
  }

  @Patch('faculties/:id')
  @Permissions('academic.update')
  async updateFaculty(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateFacultyDto>,
    @CurrentUser() user: { userId: number },
  ) {
    const faculty = await this.academicsService.updateFaculty(id, dto);
    await this.auditService.log({
      action: 'faculty.updated',
      entity: 'Faculty',
      entityId: id,
      userId: user.userId,
    });
    return faculty;
  }

  @Delete('faculties/:id')
  @Permissions('academic.delete')
  async deleteFaculty(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    await this.academicsService.deleteFaculty(id);
    await this.auditService.log({
      action: 'faculty.deleted',
      entity: 'Faculty',
      entityId: id,
      userId: user.userId,
    });
    return { message: 'Faculty deleted' };
  }

  // ---- Departments ----
  @Get('departments')
  @Permissions('academic.view')
  listDepartments() {
    return this.academicsService.listDepartments();
  }

  @Post('departments')
  @Permissions('academic.create')
  async createDepartment(@Body() dto: CreateDepartmentDto, @CurrentUser() user: { userId: number }) {
    const dept = await this.academicsService.createDepartment(dto);
    await this.auditService.log({
      action: 'department.created',
      entity: 'Department',
      entityId: dept.id,
      userId: user.userId,
    });
    return dept;
  }

  @Patch('departments/:id')
  @Permissions('academic.update')
  async updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateDepartmentDto>,
    @CurrentUser() user: { userId: number },
  ) {
    const dept = await this.academicsService.updateDepartment(id, dto);
    await this.auditService.log({
      action: 'department.updated',
      entity: 'Department',
      entityId: id,
      userId: user.userId,
    });
    return dept;
  }

  @Delete('departments/:id')
  @Permissions('academic.delete')
  async deleteDepartment(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    await this.academicsService.deleteDepartment(id);
    await this.auditService.log({
      action: 'department.deleted',
      entity: 'Department',
      entityId: id,
      userId: user.userId,
    });
    return { message: 'Department deleted' };
  }

  // ---- Programs ----
  @Get('programs')
  @Permissions('academic.view')
  listPrograms(@Query('departmentId') departmentId?: string) {
    if (departmentId) {
      return this.academicsService
        .listPrograms()
        .then((ps) => ps.filter((p) => p.departmentId === Number(departmentId)));
    }
    return this.academicsService.listPrograms();
  }

  @Post('programs')
  @Permissions('academic.create')
  async createProgram(@Body() dto: CreateProgramDto, @CurrentUser() user: { userId: number }) {
    const program = await this.academicsService.createProgram(dto);
    await this.auditService.log({
      action: 'program.created',
      entity: 'Program',
      entityId: program.id,
      userId: user.userId,
    });
    return program;
  }

  @Patch('programs/:id')
  @Permissions('academic.update')
  async updateProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateProgramDto>,
    @CurrentUser() user: { userId: number },
  ) {
    const program = await this.academicsService.updateProgram(id, dto);
    await this.auditService.log({
      action: 'program.updated',
      entity: 'Program',
      entityId: id,
      userId: user.userId,
    });
    return program;
  }

  @Delete('programs/:id')
  @Permissions('academic.delete')
  async deleteProgram(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    await this.academicsService.deleteProgram(id);
    await this.auditService.log({
      action: 'program.deleted',
      entity: 'Program',
      entityId: id,
      userId: user.userId,
    });
    return { message: 'Program deleted' };
  }

  // ---- Levels ----
  @Get('levels')
  @Permissions('academic.view')
  listLevels() {
    return this.academicsService.listLevels();
  }

  @Post('levels')
  @Permissions('academic.create')
  async createLevel(@Body() dto: CreateLevelDto, @CurrentUser() user: { userId: number }) {
    const level = await this.academicsService.createLevel(dto);
    await this.auditService.log({
      action: 'level.created',
      entity: 'Level',
      entityId: level.id,
      userId: user.userId,
    });
    return level;
  }

  @Patch('levels/:id')
  @Permissions('academic.update')
  async updateLevel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateLevelDto>,
    @CurrentUser() user: { userId: number },
  ) {
    const level = await this.academicsService.updateLevel(id, dto);
    await this.auditService.log({
      action: 'level.updated',
      entity: 'Level',
      entityId: id,
      userId: user.userId,
    });
    return level;
  }

  @Delete('levels/:id')
  @Permissions('academic.delete')
  async deleteLevel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    await this.academicsService.deleteLevel(id);
    await this.auditService.log({
      action: 'level.deleted',
      entity: 'Level',
      entityId: id,
      userId: user.userId,
    });
    return { message: 'Level deleted' };
  }

  // ---- Cohorts ----
  @Get('cohorts')
  @Permissions('academic.view')
  listCohorts(@Query('programId') programId?: string) {
    return this.academicsService.listCohorts(programId ? Number(programId) : undefined);
  }

  @Post('cohorts')
  @Permissions('academic.create')
  async createCohort(@Body() dto: CreateCohortDto, @CurrentUser() user: { userId: number }) {
    const cohort = await this.academicsService.createCohort(dto);
    await this.auditService.log({
      action: 'cohort.created',
      entity: 'Cohort',
      entityId: cohort.id,
      userId: user.userId,
      details: { code: cohort.code },
    });
    return cohort;
  }

  @Patch('cohorts/:id')
  @Permissions('academic.update')
  async updateCohort(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCohortDto>,
    @CurrentUser() user: { userId: number },
  ) {
    const cohort = await this.academicsService.updateCohort(id, dto);
    await this.auditService.log({
      action: 'cohort.updated',
      entity: 'Cohort',
      entityId: id,
      userId: user.userId,
    });
    return cohort;
  }

  // ---- Academic Years ----
  @Get('academic-years')
  @Permissions('academic.view')
  listAcademicYears() {
    return this.academicsService.listAcademicYears();
  }

  @Post('academic-years')
  @Permissions('academic.create')
  async createAcademicYear(
    @Body() dto: CreateAcademicYearDto,
    @CurrentUser() user: { userId: number },
  ) {
    const year = await this.academicsService.createAcademicYear(dto);
    await this.auditService.log({
      action: 'academic_year.created',
      entity: 'AcademicYear',
      entityId: year.id,
      userId: user.userId,
    });
    return year;
  }
}