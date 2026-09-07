import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';

export enum NotificationType {
  GRADE = 'grade',
  EXAM = 'exam',
  TIMETABLE = 'timetable',
  ANNOUNCEMENT = 'announcement',
  PAYMENT = 'payment',
  DOCUMENT = 'document',
  ACADEMIC = 'academic',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id', nullable: true })
  studentId: number;

  @Column({ nullable: true, name: 'staff_id' })
  staffId: number;

  @Column({ type: 'varchar', length: 30 })
  type: NotificationType;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', default: 'info' })
  level: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ nullable: true })
  relatedEntity: string;

  @Column({ nullable: true, name: 'related_entity_id' })
  relatedEntityId: number;
}