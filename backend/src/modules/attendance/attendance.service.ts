import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';

export interface AttendanceEntryDto {
  studentId: number;
  status: AttendanceStatus;
}

export interface SaveAttendanceDto {
  courseId: number;
  date: string;
  entries: AttendanceEntryDto[];
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async saveAttendance(dto: SaveAttendanceDto, recordedBy: number) {
    const course = await this.courseRepo.findOneBy({ id: dto.courseId });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const entries = dto.entries.map((entry) => ({
      studentId: entry.studentId,
      status: entry.status ?? AttendanceStatus.PRESENT,
    }));

    const enrolled = await this.enrollmentRepo.find({ where: { courseId: dto.courseId } });
    const enrolledIds = new Set(enrolled.map((e) => e.studentId));
    for (const entry of entries) {
      if (!enrolledIds.has(entry.studentId)) {
        throw new BadRequestException(
          `Student ${entry.studentId} is not enrolled in this course`,
        );
      }
    }

    for (const entry of entries) {
      const existing = await this.attendanceRepo.findOneBy({
        studentId: entry.studentId,
        courseId: dto.courseId,
        date: dto.date,
      });
      if (existing) {
        existing.status = entry.status;
        existing.recordedById = recordedBy;
        await this.attendanceRepo.save(existing);
      } else {
        await this.attendanceRepo.save(
          this.attendanceRepo.create({
            studentId: entry.studentId,
            courseId: dto.courseId,
            date: dto.date,
            status: entry.status,
            recordedById: recordedBy,
          }),
        );
      }
    }

    return { saved: entries.length, date: dto.date, courseId: dto.courseId };
  }

  async listClassDates(courseId: number) {
    const rows = await this.attendanceRepo
      .createQueryBuilder('attendance')
      .select('DISTINCT attendance.date', 'date')
      .where('attendance.course_id = :courseId', { courseId })
      .orderBy('date', 'DESC')
      .getRawMany<{ date: string }>();
    return rows.map((r) => r.date);
  }

  async getByCourse(courseId: number) {
    const records = await this.attendanceRepo.find({
      where: { courseId },
      relations: { student: true },
      order: { date: 'DESC' },
    });
    return records;
  }

  async getByCourseAndDate(courseId: number, date: string) {
    return this.attendanceRepo.find({
      where: { courseId, date },
      relations: { student: true },
      order: { id: 'ASC' },
    });
  }

  async getByStudent(studentId: number) {
    return this.attendanceRepo.find({
      where: { studentId },
      relations: { course: true },
      order: { date: 'DESC' },
    });
  }

  async computePercentage(courseId: number, studentId: number) {
    const rows = await this.attendanceRepo.find({ where: { courseId, studentId } });
    const total = rows.length;
    const attended = rows.filter(
      (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE,
    ).length;
    return {
      total,
      attended,
      percentage: total > 0 ? Math.round((attended / total) * 10000) / 100 : null,
    };
  }

  async stats(courseId: number) {
    const rows = await this.attendanceRepo.find({ where: { courseId } });
    const present = rows.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const late = rows.filter((r) => r.status === AttendanceStatus.LATE).length;
    const absent = rows.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    return { total: rows.length, present, late, absent };
  }
}