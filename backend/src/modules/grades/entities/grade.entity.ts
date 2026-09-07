import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Assessment } from './assessment.entity';

export enum GradeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
}

@Entity('grades')
@Unique(['studentId', 'assessmentId'])
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: number;

  @ManyToOne(() => Assessment, { eager: true })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @Column({ name: 'assessment_id' })
  assessmentId: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  score: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  grade: string | null;

  @Column({ type: 'varchar', length: 20, default: GradeStatus.DRAFT })
  status: GradeStatus;

  @Column({ name: 'entered_by', nullable: true })
  enteredById: number;

  @Column({ name: 'validated_by', nullable: true })
  validatedById: number;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}