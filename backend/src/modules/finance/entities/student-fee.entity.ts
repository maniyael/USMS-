import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Payment } from './payment.entity';

export enum FeeType {
  TUITION = 'tuition',
  REGISTRATION = 'registration',
  OTHER = 'other',
}

@Entity('student_fees')
@Unique(['studentId', 'feeType', 'academicYear', 'semester'])
export class StudentFee {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ type: 'varchar', length: 30 })
  feeType: FeeType;

  @Column({ length: 150, nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'int' })
  semester: number;

  @OneToMany(() => Payment, (p) => p.fee)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}