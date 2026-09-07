import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Curriculum } from '../courses/entities/curriculum.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { GpaService } from '../../common/services/gpa.service';

export interface EnrollStudentsDto {
  studentIds: number[];
  courseIds: number[];
  academicYear: string;
  semester: number;
}

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Curriculum)
    private readonly curriculumRepo: Repository<Curriculum>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly gpaService: GpaService,
  ) {}

  async list(
    programId?: number,
    levelId?: number,
    academicYear?: string,
    semester?: number,
    courseId?: number,
    studentId?: number,
  ) {
    const qb = this.enrollmentRepo
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.course', 'course')
      .orderBy('enrollment.academicYear', 'DESC')
      .addOrderBy('enrollment.semester', 'DESC');

    if (programId) {
      qb.andWhere('student.program_id = :programId', { programId });
    }
    if (levelId) {
      qb.andWhere('student.level_id = :levelId', { levelId });
    }
    if (academicYear) {
      qb.andWhere('enrollment.academicYear = :academicYear', { academicYear });
    }
    if (semester) {
      qb.andWhere('enrollment.semester = :semester', { semester });
    }
    if (courseId) {
      qb.andWhere('enrollment.course_id = :courseId', { courseId });
    }
    if (studentId) {
      qb.andWhere('enrollment.student_id = :studentId', { studentId });
    }
    return qb.getMany();
  }

  async enrollStudents(dto: EnrollStudentsDto): Promise<{ created: number; skipped: number }> {
    const { studentIds, courseIds, academicYear, semester } = dto;

    for (const courseId of courseIds) {
      const course = await this.courseRepo.findOneBy({ id: courseId });
      if (!course) {
        throw new NotFoundException(`Course ${courseId} not found`);
      }
    }

    let created = 0;
    let skipped = 0;

    for (const studentId of studentIds) {
      const student = await this.studentExists(studentId);
      const summary = await this.gpaService.computeStudentSummary(studentId);

      for (const courseId of courseIds) {
        const existing = await this.enrollmentRepo.findOneBy({
          studentId,
          courseId,
          academicYear,
          semester,
        });
        if (existing) {
          skipped++;
          continue;
        }

        await this.assertPrerequisites(student, courseId, academicYear, semester, summary.courses);

        await this.enrollmentRepo.save(
          this.enrollmentRepo.create({
            studentId,
            courseId,
            academicYear,
            semester,
            enrollmentStatus: EnrollmentStatus.ENROLLED,
            attemptNumber: 1,
          }),
        );
        created++;
      }
    }

    return { created, skipped };
  }

  async enrollRetake(studentId: number, courseId: number, academicYear: string, semester: number) {
    await this.studentExists(studentId);

    const previous = await this.enrollmentRepo.find({
      where: { studentId, courseId },
      order: { attemptNumber: 'DESC' },
    });

    const attemptNumber = previous.length ? previous[0].attemptNumber + 1 : 1;

    const existing = await this.enrollmentRepo.findOneBy({
      studentId,
      courseId,
      academicYear,
      semester,
    });
    if (existing) {
      throw new ConflictException('Student is already enrolled in this course for this semester');
    }

    const enrollment = await this.enrollmentRepo.save(
      this.enrollmentRepo.create({
        studentId,
        courseId,
        academicYear,
        semester,
        enrollmentStatus: EnrollmentStatus.ENROLLED,
        attemptNumber,
        parentEnrollmentId: previous[0]?.id,
      }),
    );

    return enrollment;
  }

  async myCourses(studentId: number) {
    return this.enrollmentRepo.find({
      where: { studentId },
      relations: { course: true },
      order: { academicYear: 'DESC', semester: 'DESC' },
    });
  }

  private async studentExists(studentId: number): Promise<Student> {
    const student = await this.studentRepo.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }
    return student;
  }

  private async assertPrerequisites(
    student: Student,
    courseId: number,
    academicYear: string,
    semester: number,
    currentSummary: { courseId: number; passed: boolean }[],
  ): Promise<void> {
    const curriculum = await this.curriculumRepo.findOne({
      where: { programId: student.programId, levelId: student.levelId, academicYear, semester },
      relations: { courses: true },
    });
    if (!curriculum) {
      return;
    }

    const entry = curriculum.courses.find((cc) => cc.courseId === courseId);
    if (!entry?.prerequisiteCourseId) {
      return;
    }

    const prerequisiteCourse = await this.courseRepo.findOneBy({ id: entry.prerequisiteCourseId });
    if (!prerequisiteCourse) {
      return;
    }

    const prerequisiteResult = currentSummary.find((c) => c.courseId === entry.prerequisiteCourseId);
    if (!prerequisiteResult || !prerequisiteResult.passed) {
      throw new BadRequestException(
        `Prerequisite not met: ${prerequisiteCourse.code} (${prerequisiteCourse.name}) must be passed before enrolling in this course`,
      );
    }
  }
}