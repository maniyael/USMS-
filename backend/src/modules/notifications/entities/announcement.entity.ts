import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AnnouncementTargetType {
  UNIVERSITY = 'university',
  FACULTY = 'faculty',
  DEPARTMENT = 'department',
  PROGRAM = 'program',
  LEVEL = 'level',
  COHORT = 'cohort',
  COURSE = 'course',
}

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 30 })
  targetType: AnnouncementTargetType;

  @Column({ nullable: true, name: 'target_id' })
  targetId: number;

  @Column({ name: 'created_by', nullable: true })
  createdById: number;

  @Column({ type: 'timestamp' })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}