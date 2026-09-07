import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, name: 'user_id' })
  userId: number;

  @Column({ length: 100 })
  action: string;

  @Column({ length: 100, nullable: true })
  entity: string;

  @Column({ nullable: true, name: 'entity_id' })
  entityId: number;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;
}