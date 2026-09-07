import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Payment } from './payment.entity';

export enum RefundStatus {
  REQUESTED = 'requested',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
}

export function generateRefundReference(id?: number): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return `RFD-${ymd}-${id ? String(id).padStart(6, '0') : Math.floor(100000 + Math.random() * 900000)}`;
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Payment, { eager: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'payment_id' })
  paymentId: number;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', length: 20, default: RefundStatus.REQUESTED })
  status: RefundStatus;

  @Column({ length: 100, unique: true })
  refundReference: string;

  @Column({ name: 'requested_by', nullable: true })
  requestedById: number;

  @Column({ type: 'timestamp', nullable: true })
  requestedAt: Date;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedById: number;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;

  @Column({ name: 'processed_by', nullable: true })
  processedById: number;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'text', nullable: true })
  processedNote: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}