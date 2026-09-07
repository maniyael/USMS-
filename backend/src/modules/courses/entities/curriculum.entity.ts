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
import { Program } from '../../academics/entities/program.entity';
import { Level } from '../../academics/entities/level.entity';
import { CurriculumCourse } from './curriculum-course.entity';

export enum Semester {
  SEMESTER_1 = 1,
  SEMESTER_2 = 2,
}

@Entity('curricula')
export class Curriculum {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Program, { eager: true })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ name: 'program_id' })
  programId: number;

  @ManyToOne(() => Level, { eager: true })
  @JoinColumn({ name: 'level_id' })
  level: Level;

  @Column({ name: 'level_id' })
  levelId: number;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'int' })
  semester: Semester;

  @OneToMany(() => CurriculumCourse, (cc) => cc.curriculum, { cascade: true })
  courses: CurriculumCourse[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
