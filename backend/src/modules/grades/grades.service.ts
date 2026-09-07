import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Assessment, AssessmentType } from './entities/assessment.entity';
import { Grade, GradeStatus } from './entities/grade.entity';
import { GradeHistory } from './entities/grade-history.entity';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { scoreToGrade } from '../../constants/grading';

export interface CreateAssessmentDto {
  courseId: number;
  name: string;
  type: AssessmentType;
  maximumScore: number;
  weight: number;
  academicYear?: string;
  semester?: number;
}

export interface ScoreEntryDto {
  studentId: number;
  score: number;
}

export interface EnterScoresDto {
  entries: ScoreEntryDto[];
}

export const MINIMUM_SUBMIT_PERCENTAGE = 80;

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(GradeHistory)
    private readonly historyRepo: Repository<GradeHistory>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  // ---- Assessments ----
  async createAssessment(dto: CreateAssessmentDto): Promise<Assessment> {
    const course = await this.courseRepo.findOneBy({ id: dto.courseId });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.assessmentRepo.save(
      this.assessmentRepo.create({
        courseId: dto.courseId,
        name: dto.name,
        type: dto.type,
        maximumScore: String(dto.maximumScore),
        weight: String(dto.weight),
        academicYear: dto.academicYear,
        semester: dto.semester,
      }),
    );
  }

  async listAssessments(courseId?: number) {
    const where = courseId ? { courseId } : {};
    return this.assessmentRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findAssessment(id: number): Promise<Assessment> {
    const assessment = await this.assessmentRepo.findOne({ where: { id }, relations: { course: true } });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }
    return assessment;
  }

  // ---- Grade entry ----
  async enterScores(assessmentId: number, dto: EnterScoresDto, enteredBy: number, status: GradeStatus) {
    const assessment = await this.findAssessment(assessmentId);
    const maxScore = parseFloat(assessment.maximumScore);

    const enrolled = await this.enrollmentRepo.find({ where: { courseId: assessment.courseId } });
    const enrolledIds = new Set(enrolled.map((e) => e.studentId));

    const saved: Grade[] = [];
    for (const entry of dto.entries) {
      if (!enrolledIds.has(entry.studentId)) {
        throw new BadRequestException(`Student ${entry.studentId} is not enrolled in this course`);
      }
      if (entry.score < 0 || entry.score > maxScore) {
        throw new BadRequestException(
          `Score for student ${entry.studentId} must be between 0 and ${maxScore}`,
        );
      }
      const gradeInfo = scoreToGrade(entry.score);
      const existing = await this.gradeRepo.findOneBy({ studentId: entry.studentId, assessmentId });

      if (existing) {
        if (existing.status === GradeStatus.VALIDATED) {
          throw new ForbiddenException(
            'This grade is validated and cannot be edited directly. Use the correction workflow.',
          );
        }
        existing.score = String(entry.score);
        existing.grade = gradeInfo?.letter ?? null;
        existing.status = status;
        existing.enteredById = enteredBy;
        saved.push(await this.gradeRepo.save(existing));
      } else {
        saved.push(
          await this.gradeRepo.save(
            this.gradeRepo.create({
              studentId: entry.studentId,
              assessmentId,
              score: String(entry.score),
              grade: gradeInfo?.letter ?? null,
              status,
              enteredById: enteredBy,
            }),
          ),
        );
      }
    }
    return saved;
  }

  async saveDraft(assessmentId: number, dto: EnterScoresDto, enteredBy: number) {
    return this.enterScores(assessmentId, dto, enteredBy, GradeStatus.DRAFT);
  }

  async submitScores(assessmentId: number, dto: EnterScoresDto, enteredBy: number) {
    const assessment = await this.findAssessment(assessmentId);
    const enrolled = await this.enrollmentRepo.find({ where: { courseId: assessment.courseId } });
    const uniqueStudents = new Set(dto.entries.map((e) => e.studentId));

    const coverage = enrolled.length
      ? Math.round((uniqueStudents.size / enrolled.length) * 100)
      : 100;
    if (coverage < MINIMUM_SUBMIT_PERCENTAGE) {
      throw new BadRequestException(
        `Cannot submit grades: only ${coverage}% of enrolled students have scores (minimum ${MINIMUM_SUBMIT_PERCENTAGE}%)`,
      );
    }

    const saved = await this.enterScores(assessmentId, dto, enteredBy, GradeStatus.SUBMITTED);
    return { saved, coverage };
  }

  async getGradesForAssessment(assessmentId: number) {
    const assessment = await this.findAssessment(assessmentId);
    const grades = await this.gradeRepo.find({
      where: { assessmentId },
      relations: { student: true },
      order: { id: 'ASC' },
    });
    const enrolled = await this.enrollmentRepo.find({
      where: { courseId: assessment.courseId },
      relations: { student: true },
    });
    return { assessment, grades, enrolled };
  }

  // ---- Validation ----
  async validateAssessment(assessmentId: number, validatedBy: number) {
    const assessment = await this.findAssessment(assessmentId);
    const grades = await this.gradeRepo.find({ where: { assessmentId } });

    if (!grades.length) {
      throw new BadRequestException('No grades to validate');
    }

    for (const grade of grades) {
      if (grade.enteredById === validatedBy) {
        throw new ForbiddenException('A lecturer cannot validate their own grades');
      }
      if (grade.status !== GradeStatus.SUBMITTED) {
        throw new BadRequestException(
          'All grades must be in Submitted status before validation',
        );
      }
    }

    await this.gradeRepo.update(
      { assessmentId },
      {
        status: GradeStatus.VALIDATED,
        validatedById: validatedBy,
        validatedAt: new Date(),
      },
    );

    return { assessmentId, validated: grades.length };
  }

  // ---- Corrections (after validation) ----
  async correctGrade(gradeId: number, newScore: number, changedBy: number) {
    const grade = await this.gradeRepo.findOneBy({ id: gradeId });
    if (!grade) {
      throw new NotFoundException('Grade not found');
    }
    if (grade.status !== GradeStatus.VALIDATED) {
      throw new BadRequestException('Only validated (official) grades can be corrected');
    }

    const assessment = await this.findAssessment(grade.assessmentId);
    const maxScore = parseFloat(assessment.maximumScore);
    if (newScore < 0 || newScore > maxScore) {
      throw new BadRequestException(
        `Score must be between 0 and ${maxScore}`,
      );
    }

    const newGradeInfo = scoreToGrade(newScore);

    await this.historyRepo.save(
      this.historyRepo.create({
        gradeId: grade.id,
        previousScore: grade.score,
        newScore: String(newScore),
        previousGrade: grade.grade,
        newGrade: newGradeInfo?.letter ?? null,
        action: 'correction',
        changedById: changedBy,
        changedAt: new Date(),
      }),
    );

    grade.score = String(newScore);
    grade.grade = newGradeInfo?.letter ?? null;
    grade.validatedById = changedBy;
    grade.validatedAt = new Date();
    await this.gradeRepo.save(grade);

    return grade;
  }

  async getStudentGrades(studentId: number) {
    return this.gradeRepo.find({
      where: { studentId },
      relations: { assessment: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getGradeHistory(gradeId: number) {
    return this.historyRepo.find({ where: { gradeId }, order: { changedAt: 'DESC' } });
  }
}