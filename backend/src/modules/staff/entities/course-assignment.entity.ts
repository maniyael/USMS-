import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Staff } from './staff.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('course_assignments')
@Unique(['staffId', 'courseId', 'academicYear', 'semester'])
export class CourseAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Staff, (s) => s.assignments, { eager: true })
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;

  @Column({ name: 'staff_id' })
  staffId: number;

  @ManyToOne(() => Course, { eager: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'int' })
  semester: number;

  @CreateDateColumn()
  createdAt: Date;
}