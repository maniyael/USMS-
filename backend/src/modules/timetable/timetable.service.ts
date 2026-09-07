import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, MoreThanOrEqual, LessThanOrEqual, Not, Repository } from 'typeorm';
import { TimetableEntry, ClassType } from './entities/timetable-entry.entity';
import { Course } from '../courses/entities/course.entity';
import { Staff } from '../staff/entities/staff.entity';

export interface CreateTimetableEntryDto {
  courseId: number;
  classType: ClassType;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  lecturerId?: number;
  academicYear: string;
  semester: number;
  startDate: string;
  endDate?: string;
}

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(TimetableEntry)
    private readonly entryRepo: Repository<TimetableEntry>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
  ) {}

  async create(dto: CreateTimetableEntryDto): Promise<TimetableEntry> {
    if (dto.dayOfWeek < 0 || dto.dayOfWeek > 6) {
      throw new BadRequestException('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    }
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    if (dto.endDate && dto.endDate < dto.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const course = await this.courseRepo.findOneBy({ id: dto.courseId });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (dto.lecturerId) {
      const lecturer = await this.staffRepo.findOneBy({ id: dto.lecturerId });
      if (!lecturer) {
        throw new NotFoundException('Lecturer not found');
      }
    }

    await this.checkConflicts(dto);

    return this.entryRepo.save(this.entryRepo.create({ ...dto }));
  }

  private async checkConflicts(dto: CreateTimetableEntryDto) {
    const overlap = await this.entryRepo
      .createQueryBuilder('entry')
      .where('entry.dayOfWeek = :day', { day: dto.dayOfWeek })
      .andWhere('entry.academicYear = :year', { year: dto.academicYear })
      .andWhere('entry.semester = :semester', { semester: dto.semester })
      .getMany();

    for (const existing of overlap) {
      const timeOverlap =
        (dto.startTime < existing.endTime) && (existing.startTime < dto.endTime);
      if (!timeOverlap) {
        continue;
      }
      if (existing.location && existing.location === dto.location) {
        throw new BadRequestException(
          `Venue '${dto.location}' is already booked at ${existing.startTime}-${existing.endTime} (${existing.classType})`,
        );
      }
      if (dto.lecturerId && existing.lecturerId === dto.lecturerId) {
        throw new BadRequestException(
          `Lecturer ${dto.lecturerId} already has a class at ${existing.startTime}-${existing.endTime}`,
        );
      }
      if (existing.courseId === dto.courseId) {
        throw new BadRequestException(
          `Course ${dto.courseId} already has a class at ${existing.startTime}-${existing.endTime}`,
        );
      }
    }
  }

  async list(filters: { courseId?: number; levelId?: number }) {
    const qb = this.entryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.course', 'course')
      .leftJoinAndSelect('entry.lecturer', 'lecturer')
      .orderBy('entry.dayOfWeek', 'ASC')
      .addOrderBy('entry.startTime', 'ASC');

    if (filters.courseId !== undefined) {
      qb.andWhere('entry.course_id = :courseId', { courseId: filters.courseId });
    }
    if (filters.levelId !== undefined) {
      qb.andWhere(
        'course.id IN (SELECT cc.course_id FROM curriculum_courses cc WHERE cc.curriculum_id IN (SELECT c.id FROM curricula c WHERE c.level_id = :levelId))',
        { levelId: filters.levelId },
      );
    }
    return qb.getMany();
  }

  async getDay(academicYear: string, semester: number, dayOfWeek: number) {
    return this.entryRepo.find({
      where: { academicYear, semester, dayOfWeek },
      relations: { course: true, lecturer: true },
      order: { startTime: 'ASC' },
    });
  }

  async remove(id: number) {
    const entry = await this.entryRepo.findOneBy({ id });
    if (!entry) {
      throw new NotFoundException('Timetable entry not found');
    }
    await this.entryRepo.remove(entry);
    return { deleted: true };
  }
}