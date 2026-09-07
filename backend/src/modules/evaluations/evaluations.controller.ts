import {
  Body,
  Controller,
  Delete,
  Get,
  ForbiddenException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import type {
  CreateCriterionDto,
  UpdateCriterionDto,
  CreatePeriodDto,
  UpdatePeriodDto,
  SubmitEvaluationDto,
} from './evaluations.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthUser {
  userId: number;
  roleName?: string;
  linkedStudentId?: number;
  linkedStaffId?: number;
}

@Controller('evaluations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EvaluationsController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly auditService: AuditService,
  ) {}

  // ---- Criteria ----
  @Get('criteria')
  @Permissions('evaluation.view')
  listCriteria() {
    return this.evaluationsService.listCriteria();
  }

  @Post('criteria')
  @Permissions('evaluation.config')
  async createCriterion(
    @Body() dto: CreateCriterionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const criterion = await this.evaluationsService.createCriterion(dto, user.userId);
    await this.auditService.log({
      action: 'evaluation.criterion_created',
      entity: 'EvaluationCriterion',
      entityId: criterion.id,
      userId: user.userId,
      details: { name: criterion.name },
    });
    return criterion;
  }

  @Put('criteria/:id')
  @Permissions('evaluation.config')
  async updateCriterion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCriterionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const criterion = await this.evaluationsService.updateCriterion(id, dto);
    await this.auditService.log({
      action: 'evaluation.criterion_updated',
      entity: 'EvaluationCriterion',
      entityId: id,
      userId: user.userId,
      details: { ...dto },
    });
    return criterion;
  }

  @Delete('criteria/:id')
  @Permissions('evaluation.config')
  async deleteCriterion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.evaluationsService.deleteCriterion(id);
    await this.auditService.log({
      action: 'evaluation.criterion_deleted',
      entity: 'EvaluationCriterion',
      entityId: id,
      userId: user.userId,
    });
    return result;
  }

  // ---- Periods ----
  @Get('periods')
  @Permissions('evaluation.view')
  listPeriods() {
    return this.evaluationsService.listPeriods();
  }

  @Post('periods')
  @Permissions('evaluation.config')
  async createPeriod(
    @Body() dto: CreatePeriodDto,
    @CurrentUser() user: AuthUser,
  ) {
    const period = await this.evaluationsService.createPeriod(dto, user.userId);
    await this.auditService.log({
      action: 'evaluation.period_created',
      entity: 'EvaluationPeriod',
      entityId: period.id,
      userId: user.userId,
      details: { name: period.name, academicYear: period.academicYear },
    });
    return period;
  }

  @Put('periods/:id')
  @Permissions('evaluation.config')
  async updatePeriod(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePeriodDto,
    @CurrentUser() user: AuthUser,
  ) {
    const before = await this.evaluationsService.listPeriods().then((p) => p.find((x) => x.id === id));
    const period = await this.evaluationsService.updatePeriod(id, dto);
    if (dto.isOpen !== undefined && before) {
      await this.auditService.log({
        action: dto.isOpen ? 'evaluation.period_opened' : 'evaluation.period_closed',
        entity: 'EvaluationPeriod',
        entityId: id,
        userId: user.userId,
        details: { name: before.name },
      });
    } else {
      await this.auditService.log({
        action: 'evaluation.period_updated',
        entity: 'EvaluationPeriod',
        entityId: id,
        userId: user.userId,
        details: { ...dto },
      });
    }
    return period;
  }

  @Delete('periods/:id')
  @Permissions('evaluation.config')
  async deletePeriod(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.evaluationsService.deletePeriod(id);
    await this.auditService.log({
      action: 'evaluation.period_deleted',
      entity: 'EvaluationPeriod',
      entityId: id,
      userId: user.userId,
    });
    return result;
  }

  // ---- Student flow ----
  @Get('eligible')
  @Permissions('evaluation.view')
  eligible(@CurrentUser() user: AuthUser) {
    if (!user.linkedStudentId) {
      throw new ForbiddenException('Your account is not linked to a student profile');
    }
    return this.evaluationsService.eligibleForStudent(user.linkedStudentId);
  }

  @Post('submit')
  @Permissions('evaluation.submit')
  async submit(
    @Body() dto: SubmitEvaluationDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.linkedStudentId) {
      throw new ForbiddenException('Your account is not linked to a student profile');
    }
    const evaluation = await this.evaluationsService.submit(user.linkedStudentId, dto);
    await this.auditService.log({
      action: 'evaluation.submitted',
      entity: 'CourseEvaluation',
      entityId: evaluation.id,
      userId: user.userId,
      details: { courseId: dto.courseId, periodId: dto.periodId, lecturerId: dto.lecturerId ?? null },
    });
    return evaluation;
  }

  @Get('mine')
  @Permissions('evaluation.view')
  mine(@CurrentUser() user: AuthUser) {
    if (!user.linkedStudentId) {
      throw new ForbiddenException('Your account is not linked to a student profile');
    }
    return this.evaluationsService.mine(user.linkedStudentId);
  }

  // ---- Results ----
  @Get('results/lecturer')
  @Permissions('evaluation.result')
  resultsForLecturer(@CurrentUser() user: AuthUser) {
    if (!user.linkedStaffId) {
      throw new ForbiddenException('Your account is not linked to a staff profile');
    }
    return this.evaluationsService.lecturerResults(user.linkedStaffId);
  }

  @Get('results/overview')
  @Permissions('evaluation.analyze')
  overview() {
    return this.evaluationsService.overview();
  }
}