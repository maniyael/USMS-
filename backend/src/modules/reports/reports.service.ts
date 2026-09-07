import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from '../enrollment/entities/enrollment.entity';
import { Student } from '../students/entities/student.entity';
import { Staff } from '../staff/entities/staff.entity';
import { Course } from '../courses/entities/course.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { StudentFee } from '../finance/entities/student-fee.entity';
import { Payment } from '../finance/entities/payment.entity';
import { Grade, GradeStatus } from '../grades/entities/grade.entity';
import { Program } from '../academics/entities/program.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Staff) private readonly staffRepo: Repository<Staff>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Attendance) private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(StudentFee) private readonly feeRepo: Repository<StudentFee>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Grade) private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Program) private readonly programRepo: Repository<Program>,
  ) {}

  async summary() {
    const [totalStudents, totalStaff, totalCourses] = await Promise.all([
      this.studentRepo.count(),
      this.staffRepo.count(),
      this.courseRepo.count(),
    ]);
    const [activeEnrollments, validatedGrades] = await Promise.all([
      this.enrollmentRepo.count({ where: { enrollmentStatus: EnrollmentStatus.ENROLLED } }),
      this.gradeRepo.count({ where: { status: GradeStatus.VALIDATED } }),
    ]);
    const feeRows = await this.feeRepo
      .createQueryBuilder('fee')
      .select('COALESCE(SUM(fee.amount), 0)', 'charged')
      .getRawOne<{ charged: string }>();
    const paymentRows = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'paid')
      .where('payment.reversedAt IS NULL')
      .getRawOne<{ paid: string }>();
    const attendanceCounts = await this.attendanceRepo
      .createQueryBuilder('a')
      .select("COUNT(*) FILTER (WHERE a.status = 'present')", 'present')
      .addSelect("COUNT(*) FILTER (WHERE a.status = 'late')", 'late')
      .addSelect("COUNT(*) FILTER (WHERE a.status = 'absent')", 'absent')
      .getRawOne<{ present: string; late: string; absent: string }>();
    const charged = parseFloat(feeRows?.charged ?? '0');
    const paid = parseFloat(paymentRows?.paid ?? '0');
    const present = parseInt(attendanceCounts?.present ?? '0', 10);
    const late = parseInt(attendanceCounts?.late ?? '0', 10);
    const absent = parseInt(attendanceCounts?.absent ?? '0', 10);
    const totalMarked = present + late + absent;
    return {
      totalStudents,
      totalStaff,
      totalCourses,
      activeEnrollments,
      validatedGrades,
      attendance: {
        present,
        late,
        absent,
        rate: totalMarked ? (present + late) / totalMarked : null,
      },
      fees: {
        charged,
        paid,
        outstanding: charged - paid,
        collectedRate: charged ? paid / charged : null,
      },
    };
  }

  async enrollmentByProgram(programId?: number) {
    const qb = this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.program', 'program')
      .select('program.id', 'programId')
      .addSelect('program.name', 'programName')
      .addSelect('COUNT(student.id)', 'count')
      .groupBy('program.id')
      .addGroupBy('program.name')
      .orderBy('COUNT(student.id)', 'DESC');
    if (programId) {
      qb.where('student.program_id = :programId', { programId });
    }
    const rows = await qb.getRawMany<{ programId: number; programName: string; count: string }>();
    return rows.map((r) => ({
      programId: r.programId,
      programName: r.programName ?? 'Unassigned',
      count: parseInt(r.count, 10),
    }));
  }

  async gradeDistribution(courseId?: number) {
    const qb = this.gradeRepo
      .createQueryBuilder('grade')
      .leftJoin('grade.assessment', 'assessment')
      .select('grade.grade', 'grade')
      .addSelect('COUNT(grade.id)', 'count')
      .where('grade.status = :status', { status: 'validated' })
      .groupBy('grade.grade')
      .orderBy('grade.grade');
    if (courseId) {
      qb.andWhere('assessment.course_id = :courseId', { courseId });
    }
    const rows = await qb.getRawMany<{ grade: string | null; count: string }>();
    return rows.map((r) => ({ grade: r.grade ?? 'unassigned', count: parseInt(r.count, 10) }));
  }
}