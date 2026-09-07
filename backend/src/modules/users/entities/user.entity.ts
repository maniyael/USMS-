import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../admin/entities/role.entity';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../staff/entities/staff.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 150 })
  username: string;

  @Column({ length: 255 })
  passwordHash: string;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ nullable: true })
  linkedStudentId: number;

  @OneToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'linked_student_id' })
  linkedStudent: Student;

  @Column({ nullable: true })
  linkedStaffId: number;

  @OneToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'linked_staff_id' })
  linkedStaff: Staff;

  @Column({ type: 'varchar', default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ default: true })
  mustChangePassword: boolean;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
