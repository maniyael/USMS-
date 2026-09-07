import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../../academics/entities/department.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';
import { Assessment } from '../../grades/entities/assessment.entity';
import { CurriculumCourse } from './curriculum-course.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  credits: number;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId: number;

  @OneToMany(() => CurriculumCourse, (cc) => cc.course)
  curriculumEntries: CurriculumCourse[];

  @OneToMany(() => Enrollment, (e) => e.course)
  enrollments: Enrollment[];

  @OneToMany(() => Assessment, (a) => a.course)
  assessments: Assessment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
