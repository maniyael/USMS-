import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';

export enum AssessmentType {
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
  TEST = 'test',
  MIDTERM = 'midterm',
  FINAL_EXAM = 'final_examination',
  PRACTICAL = 'practical',
  PROJECT = 'project',
}

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Course, (c) => c.assessments, { eager: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  type: AssessmentType;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  maximumScore: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  weight: string;

  @Column({ length: 20, nullable: true })
  academicYear: string;

  @Column({ type: 'int', nullable: true })
  semester: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}