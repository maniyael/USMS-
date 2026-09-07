import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import type { CreateFeeDto, RecordPaymentDto, GenerateFeesForLevelDto } from './finance.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
  ) {}

  // ---- Fees ----
  @Post('fees')
  @Permissions('fees.manage')
  async addFee(
    @Body() dto: CreateFeeDto,
    @CurrentUser() user: { userId: number },
  ) {
    const fee = await this.financeService.addFee(dto, user.userId);
    await this.auditService.log({
      action: 'fee.created',
      entity: 'StudentFee',
      entityId: fee.id,
      userId: user.userId,
      details: dto as unknown as Record<string, unknown>,
    });
    return fee;
  }

  @Post('fees/generate-level')
  @Permissions('fees.manage')
  async generateLevel(
    @Body() dto: GenerateFeesForLevelDto,
    @CurrentUser() user: { userId: number },
  ) {
    const result = await this.financeService.generateFeesForLevel(dto, user.userId);
    await this.auditService.log({
      action: 'fees.generated_for_level',
      entity: 'StudentFee',
      userId: user.userId,
      details: { ...(dto as unknown as Record<string, unknown>), ...result },
    });
    return result;
  }

  @Get('fees')
  @Permissions('finance.view')
  listFees(
    @Query('studentId') studentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    return this.financeService.listFees({
      studentId: studentId ? Number(studentId) : undefined,
      academicYear,
      semester: semester ? Number(semester) : undefined,
    });
  }

  // ---- Payments ----
  @Post('payments')
  @Permissions('payment.record')
  async recordPayment(
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: { userId: number },
  ) {
    const result = await this.financeService.recordPayment(dto, user.userId);
    await this.auditService.log({
      action: 'payment.recorded',
      entity: 'Payment',
      entityId: result.payment.id,
      userId: user.userId,
      details: { amount: dto.amount, method: dto.paymentMethod, feeId: dto.feeId },
    });
    return result;
  }

  @Post('payments/:id/reverse')
  @Permissions('payment.reverse')
  async reverse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { note: string },
    @CurrentUser() user: { userId: number },
  ) {
    const payment = await this.financeService.reversePayment(id, dto.note, user.userId);
    await this.auditService.log({
      action: 'payment.reversed',
      entity: 'Payment',
      entityId: id,
      userId: user.userId,
      details: { note: dto.note },
    });
    return payment;
  }

  @Get('payments')
  @Permissions('finance.view')
  listPayments(
    @Query('studentId') studentId?: string,
    @Query('feeId') feeId?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.listPayments({
      studentId: studentId ? Number(studentId) : undefined,
      feeId: feeId ? Number(feeId) : undefined,
      status,
    });
  }

  // ---- Balances & statements ----
  @Get('balance/student/:studentId')
  @Permissions('finance.view')
  studentBalance(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.financeService.balanceForStudent(studentId);
  }

  @Get('statement/student/:studentId')
  @Permissions('finance.view')
  studentStatement(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.financeService.studentStatement(studentId);
  }

  @Get('balance/fee/:feeId')
  @Permissions('finance.view')
  feeBalance(@Param('feeId', ParseIntPipe) feeId: number) {
    return this.financeService.balanceForFee(feeId);
  }
}