import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Curriculum } from './curriculum.entity';
import { Course } from './course.entity';

@Entity('curriculum_courses')
@Unique(['curriculumId', 'courseId'])
export class CurriculumCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Curriculum, (c) => c.courses)
  @JoinColumn({ name: 'curriculum_id' })
  curriculum: Curriculum;

  @Column({ name: 'curriculum_id' })
  curriculumId: number;

  @ManyToOne(() => Course, { eager: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ default: true })
  isRequired: boolean;

  @Column({ name: 'prerequisite_course_id', nullable: true })
  prerequisiteCourseId: number;
}