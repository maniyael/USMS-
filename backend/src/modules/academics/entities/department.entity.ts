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
import { Faculty } from './faculty.entity';
import { Program } from './program.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 20 })
  code: string;

  @ManyToOne(() => Faculty, (f) => f.departments, { eager: true })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Faculty;

  @Column({ name: 'faculty_id' })
  facultyId: number;

  @OneToMany(() => Program, (p) => p.department)
  programs: Program[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
