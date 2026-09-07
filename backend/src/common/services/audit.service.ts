import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';

export interface AuditDetail {
  previous?: Record<string, unknown>;
  next?: Record<string, unknown>;
  [key: string]: unknown;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    action: string;
    entity?: string;
    entityId?: number;
    userId?: number;
    details?: AuditDetail | string;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const entry = this.auditRepo.create({
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      userId: params.userId,
      details: params.details ? JSON.stringify(params.details) : undefined,
      ipAddress: params.ipAddress,
      timestamp: new Date(),
    });
    return this.auditRepo.save(entry);
  }
}