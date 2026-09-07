import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { EvaluationPeriod } from './evaluation-period.entity';

@Entity('course_evaluations')
export class CourseEvaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => EvaluationPeriod, { eager: true })
  @JoinColumn({ name: 'period_id' })
  period: EvaluationPeriod;

  @Column({ name: 'period_id' })
  periodId: number;

  @Column({ name: 'student_id' })
  studentId: number;

  @ManyToOne(() => Course, { eager: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ name: 'lecturer_id', type: 'int', nullable: true })
  lecturerId: number | null;

  @Column({ type: 'jsonb' })
  responses: Record<string, number>;

  @Column({ name: 'overall_rating', type: 'numeric', precision: 3, scale: 2 })
  overallRating: string;

  @Column({ name: 'written_feedback', type: 'text', nullable: true })
  writtenFeedback: string | null;

  @Column({ type: 'timestamp', default: () => 'now()' })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}