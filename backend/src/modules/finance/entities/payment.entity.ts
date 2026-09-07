import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { StudentFee } from './student-fee.entity';
import { Receipt } from './receipt.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CHEQUE = 'cheque',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: number;

  @ManyToOne(() => StudentFee, (f) => f.payments, { eager: true })
  @JoinColumn({ name: 'fee_id' })
  fee: StudentFee;

  @Column({ name: 'fee_id' })
  feeId: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ type: 'varchar', length: 30 })
  paymentMethod: PaymentMethod;

  @Column({ length: 100, unique: true })
  paymentReference: string;

  @Column({ name: 'recorded_by', nullable: true })
  recordedById: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  reversalNote: string;

  @Column({ type: 'timestamp', nullable: true })
  reversedAt: Date;

  @OneToOne(() => Receipt, (r) => r.payment, { nullable: true })
  receipt: Receipt;

  @CreateDateColumn()
  createdAt: Date;
}