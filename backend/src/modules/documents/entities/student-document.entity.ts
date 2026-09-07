import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';

export enum DocumentType {
  STUDENT_CARD = 'student_card',
  ENROLLMENT_CERTIFICATE = 'enrollment_certificate',
  ACADEMIC_TRANSCRIPT = 'academic_transcript',
  SEMESTER_RESULT_SHEET = 'semester_result_sheet',
  ANNUAL_RESULT_SHEET = 'annual_result_sheet',
  PAYMENT_RECEIPT = 'payment_receipt',
  OTHER = 'other',
}

@Entity('documents')
export class StudentDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ type: 'varchar', length: 50 })
  documentType: DocumentType;

  @Column({ length: 100, unique: true })
  documentNumber: string;

  @Column({ length: 255, nullable: true })
  filePath: string;

  @Column({ name: 'generated_by', nullable: true })
  generatedById: number;

  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}