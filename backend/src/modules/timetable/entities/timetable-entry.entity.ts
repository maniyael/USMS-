import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Staff } from '../../staff/entities/staff.entity';

export enum ClassType {
  LECTURE = 'lecture',
  TUTORIAL = 'tutorial',
  PRACTICAL = 'practical',
  EXAM = 'exam',
}

@Entity('timetable_entries')
export class TimetableEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Course, { eager: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ type: 'varchar', length: 20 })
  classType: ClassType;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column({ length: 10 })
  startTime: string;

  @Column({ length: 10 })
  endTime: string;

  @Column({ length: 100, nullable: true })
  location: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'lecturer_id' })
  lecturer: Staff;

  @Column({ name: 'lecturer_id', nullable: true })
  lecturerId: number;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'int' })
  semester: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'varchar', default: 'scheduled' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}