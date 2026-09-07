import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Announcement, AnnouncementTargetType } from './entities/announcement.entity';
import { Student } from '../students/entities/student.entity';

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  targetType: AnnouncementTargetType;
  targetId?: number;
  publishedAt?: Date;
  expiresAt?: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async create(dto: CreateAnnouncementDto, createdById: number) {
    const now = new Date();
    const published = dto.publishedAt ?? now;
    const announcement = this.announcementRepo.create({
      title: dto.title,
      body: dto.body,
      targetType: dto.targetType,
      targetId: dto.targetId,
      publishedAt: published,
      expiresAt: dto.expiresAt,
      createdById,
    });
    return this.announcementRepo.save(announcement);
  }

  async list(filters: {
    targetType?: AnnouncementTargetType;
    targetId?: number;
    active?: boolean;
  }) {
    const now = new Date();
    const qb = this.announcementRepo
      .createQueryBuilder('a')
      .orderBy('a.publishedAt', 'DESC');

    if (filters.targetType !== undefined) {
      qb.andWhere('a.targetType = :targetType', { targetType: filters.targetType });
    }
    if (filters.targetId !== undefined) {
      qb.andWhere('(a.target_id = :targetId OR a.target_id IS NULL)', { targetId: filters.targetId });
    }
    if (filters.active) {
      qb.andWhere('a.publishedAt <= :now', { now });
      qb.andWhere('(a.expiresAt IS NULL OR a.expiresAt > :now)', { now });
    }
    return qb.getMany();
  }

  async findOne(id: number) {
    const a = await this.announcementRepo.findOneBy({ id });
    if (!a) {
      throw new NotFoundException('Announcement not found');
    }
    return a;
  }

  async update(id: number, dto: Partial<CreateAnnouncementDto>) {
    const a = await this.findOne(id);
    Object.assign(a, dto);
    return this.announcementRepo.save(a);
  }

  async remove(id: number) {
    const a = await this.findOne(id);
    await this.announcementRepo.remove(a);
    return { deleted: true };
  }

  async forStudent(studentId: number, studentContext: {
    facultyId?: number;
    departmentId?: number;
    programId?: number;
    levelId?: number;
    cohortId?: number;
  }) {
    const context = { ...studentContext };
    if (context.facultyId === undefined || context.departmentId === undefined ||
        context.programId === undefined || context.levelId === undefined ||
        context.cohortId === undefined) {
      const student = await this.studentRepo.findOneBy({ id: studentId });
      if (!student) {
        throw new NotFoundException('Student not found');
      }
      if (context.facultyId === undefined && student.program?.department?.facultyId !== undefined) {
        context.facultyId = student.program.department.facultyId;
      }
      if (context.departmentId === undefined && student.program?.departmentId !== undefined) {
        context.departmentId = student.program.departmentId;
      }
      if (context.programId === undefined) {
        context.programId = student.programId;
      }
      if (context.levelId === undefined) {
        context.levelId = student.levelId;
      }
      if (context.cohortId === undefined) {
        context.cohortId = student.cohortId;
      }
    }
    const now = new Date();
    const qb = this.announcementRepo
      .createQueryBuilder('a')
      .where('a.publishedAt <= :now', { now })
      .andWhere('(a.expiresAt IS NULL OR a.expiresAt > :now)', { now })
      .andWhere(
        `(a.targetType = :university
          OR (a.targetType = :faculty    AND a.target_id = :facultyId)
          OR (a.targetType = :department  AND a.target_id = :departmentId)
          OR (a.targetType = :program    AND a.target_id = :programId)
          OR (a.targetType = :level      AND a.target_id = :levelId)
          OR (a.targetType = :cohort     AND a.target_id = :cohortId)
        )`,
        {
          university: AnnouncementTargetType.UNIVERSITY,
          faculty: AnnouncementTargetType.FACULTY,
          department: AnnouncementTargetType.DEPARTMENT,
          program: AnnouncementTargetType.PROGRAM,
          level: AnnouncementTargetType.LEVEL,
          cohort: AnnouncementTargetType.COHORT,
          facultyId: context.facultyId ?? null,
          departmentId: context.departmentId ?? null,
          programId: context.programId ?? null,
          levelId: context.levelId ?? null,
          cohortId: context.cohortId ?? null,
        },
      )
      .orderBy('a.publishedAt', 'DESC');

    return qb.getMany();
  }
}