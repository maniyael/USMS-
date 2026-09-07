import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('academic_years')
export class AcademicYear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  name: string;

  @Column({ type: 'int' })
  startYear: number;

  @Column({ type: 'int' })
  endYear: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
