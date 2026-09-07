import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import type {
  CreateFeeDto,
  RecordPaymentDto,
  GenerateFeesForLevelDto,
  RequestRefundDto,
} from './finance.service';
import { RefundStatus } from './entities/refund.entity';
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
    @CurrentUser() user: { userId: number; linkedStudentId?: number; roleName?: string },
    @Query('studentId') studentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    const scopedStudentId =
      user.roleName === 'student' ? user.linkedStudentId : studentId ? Number(studentId) : undefined;
    return this.financeService.listFees({
      studentId: scopedStudentId,
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
    @CurrentUser() user: { userId: number; linkedStudentId?: number; roleName?: string },
    @Query('studentId') studentId?: string,
    @Query('feeId') feeId?: string,
    @Query('status') status?: string,
  ) {
    const scopedStudentId =
      user.roleName === 'student' ? user.linkedStudentId : studentId ? Number(studentId) : undefined;
    return this.financeService.listPayments({
      studentId: scopedStudentId,
      feeId: feeId ? Number(feeId) : undefined,
      status,
    });
  }

  // ---- Balances & statements ----
  @Get('balance/student/:studentId')
  @Permissions('finance.view')
  async studentBalance(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: { userId: number; linkedStudentId?: number; roleName?: string },
  ) {
    if (user.roleName === 'student' && user.linkedStudentId !== studentId) {
      throw new NotFoundException('Student not found');
    }
    return this.financeService.balanceForStudent(studentId);
  }

  @Get('statement/student/:studentId')
  @Permissions('finance.view')
  async studentStatement(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: { userId: number; linkedStudentId?: number; roleName?: string },
  ) {
    if (user.roleName === 'student' && user.linkedStudentId !== studentId) {
      throw new NotFoundException('Student not found');
    }
    return this.financeService.studentStatement(studentId);
  }

  @Get('balance/fee/:feeId')
  @Permissions('finance.view')
  feeBalance(@Param('feeId', ParseIntPipe) feeId: number) {
    return this.financeService.balanceForFee(feeId);
  }

  // ---- Refunds ----
  @Post('refunds')
  @Permissions('refund.request')
  async requestRefund(
    @Body() dto: RequestRefundDto,
    @CurrentUser() user: { userId: number; linkedStudentId?: number; roleName?: string },
  ) {
    const refund = await this.financeService.requestRefund(dto, user.userId);
    await this.auditService.log({
      action: 'refund.requested',
      entity: 'Refund',
      entityId: refund.id,
      userId: user.userId,
      details: {
        paymentId: dto.paymentId,
        amount: refund.amount,
        reason: refund.reason,
        reference: refund.refundReference,
      },
    });
    return refund;
  }

  @Get('refunds')
  @Permissions('refund.view')
  listRefunds(
    @CurrentUser() user: { userId: number; linkedStudentId?: number; roleName?: string },
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    const scopedStudentId =
      user.roleName === 'student'
        ? user.linkedStudentId
        : studentId
          ? Number(studentId)
          : undefined;
    return this.financeService.listRefunds({
      studentId: scopedStudentId,
      status: status as RefundStatus | undefined,
    });
  }

  @Get('refunds/:id')
  @Permissions('refund.view')
  async getRefund(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: number; linkedStudentId?: number; roleName?: string },
  ) {
    const refund = await this.financeService.getRefund(id);
    if (user.roleName === 'student' && user.linkedStudentId !== refund.studentId) {
      throw new NotFoundException('Refund not found');
    }
    return refund;
  }

  @Post('refunds/:id/review')
  @Permissions('refund.manage')
  async reviewRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { decision: 'under_review' | 'approved' | 'rejected'; note?: string },
    @CurrentUser() user: { userId: number },
  ) {
    const refund = await this.financeService.reviewRefund(id, dto.decision, dto.note ?? '', user.userId);
    await this.auditService.log({
      action: `refund.${refund.status}`,
      entity: 'Refund',
      entityId: id,
      userId: user.userId,
      details: { reference: refund.refundReference, note: dto.note },
    });
    return refund;
  }

  @Post('refunds/:id/process')
  @Permissions('refund.manage')
  async processRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { note?: string },
    @CurrentUser() user: { userId: number },
  ) {
    const refund = await this.financeService.processRefund(id, dto.note ?? '', user.userId);
    await this.auditService.log({
      action: 'refund.processed',
      entity: 'Refund',
      entityId: id,
      userId: user.userId,
      details: { reference: refund.refundReference, amount: refund.amount, note: dto.note },
    });
    return refund;
  }

  @Post('refunds/:id/cancel')
  @Permissions('refund.manage')
  async cancelRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { note?: string },
    @CurrentUser() user: { userId: number },
  ) {
    const refund = await this.financeService.cancelRefund(id, dto.note ?? '', user.userId);
    await this.auditService.log({
      action: 'refund.cancelled',
      entity: 'Refund',
      entityId: id,
      userId: user.userId,
      details: { reference: refund.refundReference, note: dto.note },
    });
    return refund;
  }
}