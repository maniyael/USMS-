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
import { GradesService } from './grades.service';
import type { EnterScoresDto, CreateAssessmentDto } from './grades.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GradeStatus } from './entities/grade.entity';

@Controller('grades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradesController {
  constructor(
    private readonly gradesService: GradesService,
    private readonly auditService: AuditService,
  ) {}

  // ---- Assessments ----
  @Post('assessments')
  @Permissions('assessment.manage')
  async createAssessment(
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() user: { userId: number },
  ) {
    const assessment = await this.gradesService.createAssessment(dto);
    await this.auditService.log({
      action: 'assessment.created',
      entity: 'Assessment',
      entityId: assessment.id,
      userId: user.userId,
      details: dto as unknown as Record<string, unknown>,
    });
    return assessment;
  }

  @Get('assessments')
  @Permissions('assessment.view')
  listAssessments(@Query('courseId') courseId?: string) {
    return this.gradesService.listAssessments(courseId ? Number(courseId) : undefined);
  }

  @Get('assessments/:id')
  @Permissions('assessment.view')
  findAssessment(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.findAssessment(id);
  }

  // ---- Grade entry ----
  @Post('assessments/:id/draft')
  @Permissions('grade.enter')
  async saveDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EnterScoresDto,
    @CurrentUser() user: { userId: number },
  ) {
    const saved = await this.gradesService.saveDraft(id, dto, user.userId);
    await this.auditService.log({
      action: 'grade.draft_saved',
      entity: 'Assessment',
      entityId: id,
      userId: user.userId,
      details: { entries: dto.entries.length, status: GradeStatus.DRAFT },
    });
    return saved;
  }

  @Post('assessments/:id/submit')
  @Permissions('grade.submit')
  async submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EnterScoresDto,
    @CurrentUser() user: { userId: number },
  ) {
    const result = await this.gradesService.submitScores(id, dto, user.userId);
    await this.auditService.log({
      action: 'grade.submitted',
      entity: 'Assessment',
      entityId: id,
      userId: user.userId,
      details: { entries: dto.entries.length, coverage: result.coverage },
    });
    return result;
  }

  @Get('assessments/:id/entries')
  @Permissions('grade.view')
  getEntries(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.getGradesForAssessment(id);
  }

  // ---- Validation ----
  @Post('assessments/:id/validate')
  @Permissions('grade.validate')
  async validate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number },
  ) {
    const result = await this.gradesService.validateAssessment(id, user.userId);
    await this.auditService.log({
      action: 'grade.validated',
      entity: 'Assessment',
      entityId: id,
      userId: user.userId,
      details: { validated: result.validated },
    });
    return result;
  }

  // ---- Corrections ----
  @Post('grade/:gradeId/correct')
  @Permissions('grade.correct')
  async correct(
    @Param('gradeId', ParseIntPipe) gradeId: number,
    @Body() dto: { newScore: number },
    @CurrentUser() user: { userId: number },
  ) {
    const grade = await this.gradesService.correctGrade(gradeId, dto.newScore, user.userId);
    await this.auditService.log({
      action: 'grade.corrected',
      entity: 'Grade',
      entityId: gradeId,
      userId: user.userId,
      details: { newScore: dto.newScore },
    });
    return grade;
  }

  @Get('grade/:gradeId/history')
  @Permissions('grade.view')
  history(@Param('gradeId', ParseIntPipe) gradeId: number) {
    return this.gradesService.getGradeHistory(gradeId);
  }

  @Get('student/:studentId')
  @Permissions('grade.view')
  async studentGrades(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: { userId: number; linkedStudentId?: number; roleName?: string },
  ) {
    if (user.roleName === 'student' && user.linkedStudentId !== studentId) {
      throw new ForbiddenException('You can only access your own grades');
    }
    return this.gradesService.getStudentGrades(studentId);
  }
}