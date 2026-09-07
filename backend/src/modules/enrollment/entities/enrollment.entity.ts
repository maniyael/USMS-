import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Course } from '../../courses/entities/course.entity';

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  COMPLETED = 'completed',
  FAILED_RETAKE = 'failed_retake',
}

@Entity('enrollments')
@Unique(['studentId', 'courseId', 'academicYear', 'semester'])
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, (s) => s.enrollments, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: number;

  @ManyToOne(() => Course, (c) => c.enrollments, { eager: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'int' })
  semester: number;

  @Column({ type: 'varchar', default: EnrollmentStatus.ENROLLED })
  enrollmentStatus: EnrollmentStatus;

  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ nullable: true, name: 'parent_enrollment_id' })
  parentEnrollmentId: number;

  @CreateDateColumn()
  createdAt: Date;
}