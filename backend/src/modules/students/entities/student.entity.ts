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
import { Program } from '../../academics/entities/program.entity';
import { Level } from '../../academics/entities/level.entity';
import { Cohort } from '../../academics/entities/cohort.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';

export enum AcademicStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  SUSPENDED = 'suspended',
  WITHDRAWN = 'withdrawn',
  REPEATING = 'repeating',
  TRANSFERRED = 'transferred',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  studentId: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: string;

  @Column({ type: 'varchar', length: 20 })
  gender: Gender;

  @Column({ length: 255, nullable: true })
  profilePhoto: string;

  @Column({ length: 100, nullable: true })
  nationality: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ length: 150, unique: true })
  institutionalEmail: string;

  @Column({ length: 100, nullable: true })
  emergencyContactName: string;

  @Column({ length: 100, nullable: true })
  emergencyContactRelationship: string;

  @Column({ length: 30, nullable: true })
  emergencyContactPhone: string;

  @ManyToOne(() => Program, { eager: true })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ name: 'program_id' })
  programId: number;

  @ManyToOne(() => Level, { eager: true })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column({ name: 'level_id' })
  levelId: number;

  @ManyToOne(() => Cohort, (c) => c.students, { eager: true })
  @JoinColumn({ name: 'cohort_id' })
  cohort: Cohort;

  @Column({ name: 'cohort_id' })
  cohortId: number;

  @Column({ type: 'varchar', default: AcademicStatus.ACTIVE })
  academicStatus: AcademicStatus;

  @Column({ type: 'date' })
  enrollmentDate: string;

  @OneToMany(() => Enrollment, (e) => e.student)
  enrollments: Enrollment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}