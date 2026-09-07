import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from '../../modules/attendance/entities/attendance.entity';
import { Grade, GradeStatus } from '../../modules/grades/entities/grade.entity';
import { Enrollment } from '../../modules/enrollment/entities/enrollment.entity';
import { StudentFee } from '../../modules/finance/entities/student-fee.entity';
import { Payment } from '../../modules/finance/entities/payment.entity';
import { scoreToGrade, computeGpaWeighted } from '../../constants/grading';

export interface CourseResult {
  courseId: number;
  courseCode: string;
  courseName: string;
  credits: number;
  academicYear: string;
  semester: number;
  assessmentCount: number;
  weightedScore: number;
  letter: string;
  points: number;
  passed: boolean;
  gradeStatus: string;
}

export interface StudentAcademicSummary {
  courses: CourseResult[];
  semesterGpa: number;
  cumulativeGpa: number;
  creditsAttempted: number;
  creditsEarned: number;
  attendancePercentage: number | null;
  classesHeld: number;
  classesAttended: number;
  totalFees: number;
  totalPaid: number;
  outstandingBalance: number;
}

@Injectable()
export class GpaService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(StudentFee)
    private readonly feeRepo: Repository<StudentFee>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async computeStudentSummary(studentId: number): Promise<StudentAcademicSummary> {
    const enrollments = await this.enrollmentRepo.find({
      where: { studentId },
      relations: { course: true },
    });

    const grades = await this.gradeRepo.find({
      where: { studentId },
      relations: { assessment: true },
    });

    // Group validated grades per course
    const courseMap = new Map<number, { enrollment: Enrollment; grades: Grade[] }>();
    for (const enrollment of enrollments) {
      courseMap.set(enrollment.courseId, { enrollment, grades: [] });
    }
    for (const grade of grades) {
      const entry = courseMap.get(grade.assessment.courseId);
      if (entry) {
        entry.grades.push(grade);
      }
    }

    const courses: CourseResult[] = [];
    const gpaItems: { points: number; credits: number }[] = [];

    for (const [, entry] of courseMap) {
      const { enrollment, grades: courseGrades } = entry;
      const validated = courseGrades.filter((g) => g.status === GradeStatus.VALIDATED);

      let weightedScore = 0;
      let totalWeight = 0;
      for (const g of validated) {
        const weight = parseFloat(g.assessment.weight);
        const maxScore = parseFloat(g.assessment.maximumScore);
        const weightApplied = weight / maxScore;
        weightedScore += parseFloat(g.score) * weightApplied;
        totalWeight += weight;
      }

      const finalScore = totalWeight > 0 ? weightedScore : 0;
      const gradeInfo = scoreToGrade(finalScore);
      const letter = validated.length ? gradeInfo?.letter ?? 'F' : 'N/A';
      const points = validated.length ? gradeInfo?.points ?? 0 : 0;

      courses.push({
        courseId: enrollment.courseId,
        courseCode: enrollment.course.code,
        courseName: enrollment.course.name,
        credits: enrollment.course.credits,
        academicYear: enrollment.academicYear,
        semester: enrollment.semester,
        assessmentCount: validated.length,
        weightedScore: Math.round(finalScore * 100) / 100,
        letter,
        points,
        passed: validated.length ? points > 0 : false,
        gradeStatus: validated.length
          ? GradeStatus.VALIDATED
          : grades.some((g) => g.assessment.courseId === enrollment.courseId && g.status === GradeStatus.SUBMITTED)
            ? GradeStatus.SUBMITTED
            : 'pending',
      });

      if (validated.length) {
        gpaItems.push({ points, credits: enrollment.course.credits });
      }
    }

    const gpa = computeGpaWeighted(gpaItems);

    // Per-semester GPA (grouped by academic year + semester)
    const bySemester = new Map<string, { points: number; credits: number }[]>();
    for (const enrollment of enrollments) {
      const key = `${enrollment.academicYear}|${enrollment.semester}`;
      if (!bySemester.has(key)) {
        bySemester.set(key, []);
      }
    }
    for (let i = 0; i < courses.length; i++) {
      const key = `${courses[i].academicYear}|${courses[i].semester}`;
      const bucket = bySemester.get(key);
      if (bucket && courses[i].points > 0 && courses[i].gradeStatus === GradeStatus.VALIDATED) {
        bucket.push({ points: courses[i].points, credits: courses[i].credits });
      }
    }
    let latestSemesterGpa = 0;
    for (const [, bucket] of bySemester) {
      if (bucket.length) {
        latestSemesterGpa = computeGpaWeighted(bucket).points;
      }
    }

    // Attendance
    const attendanceStats = await this.attendanceRepo
      .createQueryBuilder('attendance')
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(*) FILTER (WHERE attendance.status IN ('${AttendanceStatus.PRESENT}', '${AttendanceStatus.LATE}'))`,
        'attended',
      )
      .where('attendance.student_id = :studentId', { studentId })
      .getRawOne<{ total: string; attended: string }>();

    const classesHeld = Number(attendanceStats?.total ?? 0);
    const classesAttended = Number(attendanceStats?.attended ?? 0);
    const attendancePercentage =
      classesHeld > 0 ? Math.round((classesAttended / classesHeld) * 10000) / 100 : null;

    // Finance
    const fees = await this.feeRepo.find({ where: { studentId } });
    const payments = await this.paymentRepo.find({
      where: { studentId, status: 'active' },
    });

    const totalFees = fees.reduce((acc, f) => acc + parseFloat(f.amount), 0);
    const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
    const outstandingBalance = Math.round((totalFees - totalPaid) * 100) / 100;

    return {
      courses,
      semesterGpa: latestSemesterGpa,
      cumulativeGpa: gpa.points,
      creditsAttempted: gpa.creditsAttempted,
      creditsEarned: gpa.creditsEarned,
      attendancePercentage,
      classesHeld,
      classesAttended,
      totalFees: Math.round(totalFees * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingBalance,
    };
  }
}