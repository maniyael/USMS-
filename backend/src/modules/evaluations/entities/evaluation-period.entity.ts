import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('evaluation_periods')
export class EvaluationPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'int' })
  semester: number;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ name: 'is_open', type: 'boolean', default: false })
  isOpen: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdById: number;

  @CreateDateColumn()
  createdAt: Date;
}