import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Grade } from './grade.entity';

@Entity('grade_history')
export class GradeHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Grade, { eager: true })
  @JoinColumn({ name: 'grade_id' })
  grade: Grade;

  @Column({ name: 'grade_id' })
  gradeId: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  previousScore: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  newScore: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  previousGrade: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  newGrade: string | null;

  @Column({ length: 20 })
  action: string;

  @Column({ name: 'changed_by', nullable: true })
  changedById: number;

  @Column({ type: 'timestamp' })
  changedAt: Date;
}