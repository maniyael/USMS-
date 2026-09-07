import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateCourseDto, CreateCurriculumDto, CurriculumCourseDto } from './dto/courses.dto';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly auditService: AuditService,
  ) {}

  // ---- Courses ----
  @Get()
  @Permissions('course.view')
  listCourses() {
    return this.coursesService.listCourses();
  }

  @Get(':id')
  @Permissions('course.view')
  findCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findCourse(id);
  }

  @Post()
  @Permissions('course.create')
  async createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: { userId: number }) {
    const course = await this.coursesService.createCourse(dto);
    await this.auditService.log({
      action: 'course.created',
      entity: 'Course',
      entityId: course.id,
      userId: user.userId,
      details: { code: course.code, name: course.name, credits: course.credits },
    });
    return course;
  }

  @Patch(':id')
  @Permissions('course.update')
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCourseDto>,
    @CurrentUser() user: { userId: number },
  ) {
    const course = await this.coursesService.updateCourse(id, dto);
    await this.auditService.log({
      action: 'course.updated',
      entity: 'Course',
      entityId: id,
      userId: user.userId,
    });
    return course;
  }

  @Delete(':id')
  @Permissions('course.delete')
  async deleteCourse(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    await this.coursesService.deleteCourse(id);
    await this.auditService.log({
      action: 'course.deleted',
      entity: 'Course',
      entityId: id,
      userId: user.userId,
    });
    return { message: 'Course deleted' };
  }

  // ---- Curricula ----
  @Get('curricula/list')
  @Permissions('curriculum.view')
  listCurricula(
    @Query('programId') programId?: string,
    @Query('levelId') levelId?: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.coursesService.listCurricula(
      programId ? Number(programId) : undefined,
      levelId ? Number(levelId) : undefined,
      academicYear,
    );
  }

  @Get('curricula/:id')
  @Permissions('curriculum.view')
  findCurriculum(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findCurriculum(id);
  }

  @Post('curricula')
  @Permissions('curriculum.create')
  async createCurriculum(
    @Body() dto: CreateCurriculumDto,
    @CurrentUser() user: { userId: number },
  ) {
    const curriculum = await this.coursesService.createCurriculum(dto);
    await this.auditService.log({
      action: 'curriculum.created',
      entity: 'Curriculum',
      entityId: curriculum.id,
      userId: user.userId,
      details: {
        programId: dto.programId,
        levelId: dto.levelId,
        academicYear: dto.academicYear,
        semester: dto.semester,
      },
    });
    return curriculum;
  }

  @Put('curricula/:id/courses')
  @Permissions('curriculum.update')
  async updateCurriculumCourses(
    @Param('id', ParseIntPipe) id: number,
    @Body() courses: CurriculumCourseDto[],
    @CurrentUser() user: { userId: number },
  ) {
    const curriculum = await this.coursesService.updateCurriculumCourses(id, courses);
    await this.auditService.log({
      action: 'curriculum.courses_updated',
      entity: 'Curriculum',
      entityId: id,
      userId: user.userId,
    });
    return curriculum;
  }

  @Delete('curricula/:id')
  @Permissions('curriculum.delete')
  async deleteCurriculum(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    await this.coursesService.deleteCurriculum(id);
    await this.auditService.log({
      action: 'curriculum.deleted',
      entity: 'Curriculum',
      entityId: id,
      userId: user.userId,
    });
    return { message: 'Curriculum deleted' };
  }
}