import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EvaluationCriterion } from './entities/evaluation-criterion.entity';
import { EvaluationPeriod } from './entities/evaluation-period.entity';
import { CourseEvaluation } from './entities/course-evaluation.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { CourseAssignment } from '../staff/entities/course-assignment.entity';

export interface CreateCriterionDto {
  name: string;
  description?: string;
}

export interface UpdateCriterionDto {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface CreatePeriodDto {
  name: string;
  academicYear: string;
  semester: number;
  startsAt: string;
  endsAt: string;
}

export interface UpdatePeriodDto {
  name?: string;
  academicYear?: string;
  semester?: number;
  startsAt?: string;
  endsAt?: string;
  isOpen?: boolean;
}

export interface SubmitEvaluationDto {
  periodId: number;
  courseId: number;
  lecturerId: number | null;
  responses: Record<string, number>;
  writtenFeedback?: string;
}

const DOUBLE_PRECISION = 2;

function round2(v: number): string {
  return `${Math.round(v * 100) / 100}`;
}

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(EvaluationCriterion)
    private readonly criterionRepo: Repository<EvaluationCriterion>,
    @InjectRepository(EvaluationPeriod)
    private readonly periodRepo: Repository<EvaluationPeriod>,
    @InjectRepository(CourseEvaluation)
    private readonly evaluationRepo: Repository<CourseEvaluation>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(CourseAssignment)
    private readonly assignmentRepo: Repository<CourseAssignment>,
  ) {}

  // ---- Criteria ----
  async listCriteria() {
    return this.criterionRepo.find({ order: { orderIndex: 'ASC', id: 'ASC' } });
  }

  async createCriterion(dto: CreateCriterionDto, createdById: number) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Criterion name is required');
    }
    const max = await this.criterionRepo
      .createQueryBuilder('c')
      .select('COALESCE(MAX(c.orderIndex), 0)', 'max')
      .getRawOne<{ max: number }>();
    return this.criterionRepo.save(
      this.criterionRepo.create({
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        orderIndex: (max?.max ?? 0) + 1,
      }),
    );
  }

  async updateCriterion(id: number, dto: UpdateCriterionDto) {
    const criterion = await this.criterionRepo.findOneBy({ id });
    if (!criterion) {
      throw new NotFoundException('Criterion not found');
    }
    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new BadRequestException('Criterion name cannot be empty');
      }
      criterion.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      criterion.description = dto.description?.trim() || null;
    }
    if (dto.active !== undefined) {
      criterion.active = dto.active;
    }
    return this.criterionRepo.save(criterion);
  }

  async deleteCriterion(id: number) {
    const criterion = await this.criterionRepo.findOneBy({ id });
    if (!criterion) {
      throw new NotFoundException('Criterion not found');
    }
    await this.criterionRepo.remove(criterion);
    return { deleted: true, id };
  }

  // ---- Periods ----
  async listPeriods() {
    return this.periodRepo.find({ order: { startsAt: 'DESC' } });
  }

  async createPeriod(dto: CreatePeriodDto, createdById: number) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Period name is required');
    }
    if (dto.semester !== 1 && dto.semester !== 2) {
      throw new BadRequestException('Semester must be 1 or 2');
    }
    const starts = new Date(dto.startsAt);
    const ends = new Date(dto.endsAt);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime()) || ends <= starts) {
      throw new BadRequestException('Period end date must be after its start date');
    }
    return this.periodRepo.save(
      this.periodRepo.create({
        name: dto.name.trim(),
        academicYear: dto.academicYear,
        semester: dto.semester,
        startsAt: starts,
        endsAt: ends,
        isOpen: false,
        createdById,
      }),
    );
  }

  async updatePeriod(id: number, dto: UpdatePeriodDto) {
    const period = await this.periodRepo.findOneBy({ id });
    if (!period) {
      throw new NotFoundException('Period not found');
    }
    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new BadRequestException('Period name cannot be empty');
      }
      period.name = dto.name.trim();
    }
    if (dto.academicYear !== undefined) period.academicYear = dto.academicYear;
    if (dto.semester !== undefined) {
      if (dto.semester !== 1 && dto.semester !== 2) {
        throw new BadRequestException('Semester must be 1 or 2');
      }
      period.semester = dto.semester;
    }
    if (dto.startsAt !== undefined) period.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) period.endsAt = new Date(dto.endsAt);
    if (dto.isOpen !== undefined) period.isOpen = dto.isOpen;
    return this.periodRepo.save(period);
  }

  async deletePeriod(id: number) {
    const period = await this.periodRepo.findOneBy({ id });
    if (!period) {
      throw new NotFoundException('Period not found');
    }
    const used = await this.evaluationRepo.countBy({ periodId: id });
    if (used > 0) {
      throw new BadRequestException('Period has submissions and cannot be deleted');
    }
    await this.periodRepo.remove(period);
    return { deleted: true, id };
  }

  private async currentOpenPeriod() {
    const now = new Date();
    const open = await this.periodRepo
      .createQueryBuilder('p')
      .where('p.is_open = true')
      .andWhere('p."startsAt" <= :now', { now })
      .andWhere('p."endsAt" >= :now', { now })
      .orderBy('p."startsAt"', 'DESC')
      .getMany();
    return open[0] ?? null;
  }

  // ---- Student eligibility & submission ----
  async eligibleForStudent(studentId: number) {
    const period = await this.currentOpenPeriod();
    if (!period) {
      return { period: null, items: [] };
    }
    const enrollments = await this.enrollmentRepo.find({
      where: { studentId, academicYear: period.academicYear, semester: period.semester },
      relations: { course: true },
    });
    const items: Array<{
      courseId: number;
      courseCode: string;
      courseName: string;
      lecturerId: number | null;
      lecturerName: string;
      alreadyEvaluated: boolean;
    }> = [];
    for (const enrollment of enrollments) {
      const assignments = await this.assignmentRepo.find({
        where: { courseId: enrollment.courseId, academicYear: period.academicYear, semester: period.semester },
        relations: { staff: true },
      });
      const lecturers = assignments.map((a) => ({
        lecturerId: a.staff.id,
        lecturerName: `${a.staff.firstName} ${a.staff.lastName}`,
      }));
      const targets =
        lecturers.length > 0
          ? lecturers
          : [{ lecturerId: null as number | null, lecturerName: '' }];
      for (const target of targets) {
        const existing = await this.evaluationRepo.findOneBy({
          periodId: period.id,
          studentId,
          courseId: enrollment.courseId,
          lecturerId: target.lecturerId ?? IsNull(),
        });
        items.push({
          courseId: enrollment.courseId,
          courseCode: enrollment.course.code,
          courseName: enrollment.course.name,
          lecturerId: target.lecturerId,
          lecturerName: target.lecturerName,
          alreadyEvaluated: !!existing,
        });
      }
    }
    return { period: { id: period.id, name: period.name }, items };
  }

  async submit(studentId: number, dto: SubmitEvaluationDto) {
    const period = await this.periodRepo.findOneBy({ id: dto.periodId });
    if (!period) {
      throw new BadRequestException('Evaluation period not found');
    }
    const now = new Date();
    if (!period.isOpen || now < period.startsAt || now > period.endsAt) {
      throw new BadRequestException('This evaluation period is not open for submissions');
    }
    const enrollment = await this.enrollmentRepo.findOneBy({
      studentId,
      courseId: dto.courseId,
      academicYear: period.academicYear,
      semester: period.semester,
    });
    if (!enrollment) {
      throw new BadRequestException('You are not enrolled in this course for the period');
    }
    if (dto.lecturerId) {
      const assignment = await this.assignmentRepo.findOneBy({
        staffId: dto.lecturerId,
        courseId: dto.courseId,
        academicYear: period.academicYear,
        semester: period.semester,
      });
      if (!assignment) {
        throw new BadRequestException('Lecturer is not assigned to this course for the period');
      }
    }
    const criteria = await this.listCriteria();
    const active = criteria.filter((c) => c.active);
    const responseKeys = Object.keys(dto.responses ?? {});
    const missing = active.filter((c) => !responseKeys.includes(String(c.id)));
    if (missing.length > 0) {
      throw new BadRequestException('Please rate every criterion before submitting');
    }
    const ratings = active.map((c) => {
      const value = dto.responses[String(c.id)];
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new BadRequestException('Ratings must be whole numbers between 1 and 5');
      }
      return value;
    });
    const existing = await this.evaluationRepo.findOneBy({
      periodId: dto.periodId,
      studentId,
      courseId: dto.courseId,
      lecturerId: dto.lecturerId ?? IsNull(),
    });
    if (existing) {
      throw new BadRequestException('You have already evaluated this course in this period; submissions are locked');
    }
    const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    return this.evaluationRepo.save(
      this.evaluationRepo.create({
        periodId: dto.periodId,
        studentId,
        courseId: dto.courseId,
        lecturerId: dto.lecturerId ?? null,
        responses: { ...dto.responses },
        overallRating: round2(mean),
        writtenFeedback: dto.writtenFeedback?.trim() || null,
        submittedAt: new Date(),
      }),
    );
  }

  async mine(studentId: number) {
    return this.evaluationRepo.find({
      where: { studentId },
      order: { submittedAt: 'DESC' },
      relations: { period: true, course: true },
    });
  }

  // ---- Aggregation (never exposes student identity) ----
  private async aggregate(evaluations: CourseEvaluation[]) {
    const criteria = await this.listCriteria();
    const byCourse = new Map<
      number,
      { courseId: number; courseCode: string; courseName: string; evals: CourseEvaluation[] }
    >();
    for (const evaluation of evaluations) {
      const entry = byCourse.get(evaluation.courseId);
      if (entry) {
        entry.evals.push(evaluation);
      } else {
        byCourse.set(evaluation.courseId, {
          courseId: evaluation.courseId,
          courseCode: evaluation.course.code,
          courseName: evaluation.course.name,
          evals: [evaluation],
        });
      }
    }
    const items: Array<{
      courseId: number;
      courseCode: string;
      courseName: string;
      responseCount: number;
      overallRating: number;
      perCriterion: Array<{ criterionId: number; name: string; mean: number }>;
    }> = [];
    for (const entry of byCourse.values()) {
      const criterionMeans = criteria.map((c) => {
        const values = entry.evals
          .map((e) => e.responses[String(c.id)])
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        const mean = values.length
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : 0;
        return { criterionId: c.id, name: c.name, mean: Math.round(mean * 100) / 100 };
      });
      const overall =
        entry.evals.reduce((sum, e) => sum + Number(e.overallRating), 0) / entry.evals.length;
      items.push({
        courseId: entry.courseId,
        courseCode: entry.courseCode,
        courseName: entry.courseName,
        responseCount: entry.evals.length,
        overallRating: Math.round(overall * 100) / 100,
        perCriterion: criterionMeans,
      });
    }
    items.sort((a, b) => b.overallRating - a.overallRating);
    return items;
  }

  async lecturerResults(staffId: number) {
    const evaluations = await this.evaluationRepo.find({
      where: { lecturerId: staffId },
      relations: { course: true, period: true },
    });
    return this.aggregate(evaluations);
  }

  async overview() {
    const evaluations = await this.evaluationRepo.find({
      relations: { course: true, period: true },
    });
    const items = await this.aggregate(evaluations);
    const overall = items.length
      ? items.reduce((sum, i) => sum + i.overallRating, 0) / items.length
      : 0;
    return {
      items,
      summary: {
        totalResponses: evaluations.length,
        overallRating: Math.round(overall * 100) / 100,
        coursesCovered: items.length,
      },
    };
  }
}