import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  @Get()
  @Permissions('audit.view')
  async list(
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const query = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.timestamp', 'DESC')
      .take(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10));

    if (entity) {
      query.andWhere('log.entity = :entity', { entity });
    }
    if (action) {
      query.andWhere('log.action = :action', { action });
    }
    if (userId) {
      query.andWhere('log.user_id = :userId', { userId: parseInt(userId, 10) });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
  }
}