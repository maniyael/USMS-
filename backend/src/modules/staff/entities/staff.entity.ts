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
import { CourseAssignment } from './course-assignment.entity';

export enum StaffPosition {
  LECTURER = 'lecturer',
  REGISTRAR = 'registrar',
  FINANCE = 'finance',
  ADMINISTRATIVE = 'administrative',
  DEPARTMENT_HEAD = 'department_head',
}

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  staffId: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id' })
  departmentId: number;

  @Column({ length: 100 })
  position: string;

  @Column({ type: 'text', nullable: true })
  qualifications: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ default: false })
  isLecturer: boolean;

  @OneToMany(() => CourseAssignment, (ca) => ca.staff)
  assignments: CourseAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}