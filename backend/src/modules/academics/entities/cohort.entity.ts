import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Program } from './program.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('cohorts')
export class Cohort {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Program, (p) => p.cohorts, { eager: true })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ name: 'program_id' })
  programId: number;

  @Column({ type: 'int' })
  startYear: number;

  @Column({ type: 'int' })
  endYear: number;

  @Column({ unique: true, length: 10 })
  code: string;

  @Column({ type: 'int', default: 0 })
  maxStudentNumber: number;

  @OneToMany(() => Student, (s) => s.cohort)
  students: Student[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
