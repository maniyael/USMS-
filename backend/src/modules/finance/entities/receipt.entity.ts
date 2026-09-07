import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Payment, (p) => p.receipt)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'payment_id' })
  paymentId: number;

  @Column({ length: 50, unique: true })
  receiptNumber: string;

  @Column({ type: 'timestamp' })
  generatedAt: Date;

  @Column({ name: 'generated_by', nullable: true })
  generatedById: number;

  @Column({ length: 255, nullable: true })
  filePath: string;

  @CreateDateColumn()
  createdAt: Date;
}