import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { StudentFee, FeeType } from './entities/student-fee.entity';
import { Payment, PaymentMethod } from './entities/payment.entity';
import { Receipt } from './entities/receipt.entity';
import { Student } from '../students/entities/student.entity';

export interface CreateFeeDto {
  studentId: number;
  feeType: FeeType;
  description?: string;
  amount: number;
  academicYear: string;
  semester: number;
}

export interface GenerateFeesForLevelDto {
  levelId: number;
  feeType: FeeType;
  description?: string;
  amount: number;
  academicYear: string;
  semester: number;
}

export interface RecordPaymentDto {
  studentId: number;
  feeId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
}

export function generatePaymentReference(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return `PAY-${ymd}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateReceiptNumber(id?: number): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return `RCT-${ymd}-${id ? String(id).padStart(6, '0') : Math.floor(100000 + Math.random() * 900000)}`;
}

const DOUBLE_PRECISION = 2;

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(StudentFee)
    private readonly feeRepo: Repository<StudentFee>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Receipt)
    private readonly receiptRepo: Repository<Receipt>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  private toNumber(v: string | number): number {
    return Math.round(Number(v) * 100) / 100;
  }

  // ---- Fees ----
  async addFee(dto: CreateFeeDto, createdBy: number): Promise<StudentFee> {
    const student = await this.studentRepo.findOneBy({ id: dto.studentId });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    const existing = await this.feeRepo.findOneBy({
      studentId: dto.studentId,
      feeType: dto.feeType,
      academicYear: dto.academicYear,
      semester: dto.semester,
    });
    if (existing) {
      throw new BadRequestException('A fee of this type already exists for this student and semester');
    }
    return this.feeRepo.save(
      this.feeRepo.create({
        studentId: dto.studentId,
        feeType: dto.feeType,
        description: dto.description,
        amount: this.toNumber(dto.amount).toFixed(DOUBLE_PRECISION),
        academicYear: dto.academicYear,
        semester: dto.semester,
      }),
    );
  }

  async generateFeesForLevel(dto: GenerateFeesForLevelDto, createdBy: number) {
    const students = await this.studentRepo
      .createQueryBuilder('student')
      .innerJoinAndSelect('student.enrollments', 'enrollment')
      .innerJoinAndSelect('enrollment.curriculum', 'curriculum')
      .where('curriculum.level_id = :levelId', { levelId: dto.levelId })
      .andWhere('student.academicStatus = :status', { status: 'active' })
      .getMany();

    let created = 0;
    for (const student of students) {
      const exists = await this.feeRepo.findOneBy({
        studentId: student.id,
        feeType: dto.feeType,
        academicYear: dto.academicYear,
        semester: dto.semester,
      });
      if (!exists) {
        await this.feeRepo.save(
          this.feeRepo.create({
            studentId: student.id,
            feeType: dto.feeType,
            description: dto.description,
            amount: this.toNumber(dto.amount).toFixed(DOUBLE_PRECISION),
            academicYear: dto.academicYear,
            semester: dto.semester,
          }),
        );
        created++;
      }
    }
    return { studentsFound: students.length, created };
  }

  async listFees(filters: { studentId?: number; academicYear?: string; semester?: number }) {
    const qb = this.feeRepo
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.student', 'student')
      .orderBy('fee.createdAt', 'DESC');
    if (filters.studentId !== undefined) {
      qb.andWhere('fee.student_id = :studentId', { studentId: filters.studentId });
    }
    if (filters.academicYear) {
      qb.andWhere('fee.academic_year = :academicYear', { academicYear: filters.academicYear });
    }
    if (filters.semester !== undefined) {
      qb.andWhere('fee.semester = :semester', { semester: filters.semester });
    }
    return qb.getMany();
  }

  // ---- Payments ----
  async recordPayment(dto: RecordPaymentDto, recordedBy: number) {
    const fee = await this.feeRepo.findOneBy({ id: dto.feeId });
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }
    if (fee.studentId !== dto.studentId) {
      throw new BadRequestException('Fee does not belong to this student');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    const balance = await this.balanceForFee(dto.feeId);
    if (this.toNumber(dto.amount).toFixed(DOUBLE_PRECISION) !== balance.outstanding) {
      throw new BadRequestException(
        `Payment amount must equal the outstanding balance (${balance.outstanding}). Partial payments are not supported; create a separate fee line if needed.`,
      );
    }

    const reference = generatePaymentReference();
    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        studentId: dto.studentId,
        feeId: dto.feeId,
        amount: this.toNumber(dto.amount).toFixed(DOUBLE_PRECISION),
        paymentDate: dto.paymentDate,
        paymentMethod: dto.paymentMethod,
        paymentReference: reference,
        recordedById: recordedBy,
        status: 'active',
      }),
    );

    const receipt = await this.receiptRepo.save(
      this.receiptRepo.create({
        paymentId: payment.id,
        receiptNumber: generateReceiptNumber(payment.id),
        generatedAt: new Date(),
        generatedById: recordedBy,
      }),
    );

    return { payment, receipt };
  }

  async reversePayment(paymentId: number, note: string, reversedBy: number) {
    if (!note || !note.trim()) {
      throw new BadRequestException('A reversal reason is required');
    }
    const payment = await this.paymentRepo.findOneBy({ id: paymentId });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status === 'reversed') {
      throw new BadRequestException('Payment is already reversed');
    }
    payment.status = 'reversed';
    payment.reversalNote = note.trim();
    payment.reversedAt = new Date();
    return this.paymentRepo.save(payment);
  }

  async listPayments(filters: { studentId?: number; feeId?: number; status?: string }) {
    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.fee', 'fee')
      .orderBy('payment.paymentDate', 'DESC');
    if (filters.studentId !== undefined) {
      qb.andWhere('payment.student_id = :studentId', { studentId: filters.studentId });
    }
    if (filters.feeId !== undefined) {
      qb.andWhere('payment.fee_id = :feeId', { feeId: filters.feeId });
    }
    if (filters.status) {
      qb.andWhere('payment.status = :status', { status: filters.status });
    }
    return qb.getMany();
  }

  // ---- Balances (computed, not stored) ----
  async balanceForFee(feeId: number) {
    const fee = await this.feeRepo.findOneBy({ id: feeId });
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }
    const paid = await this.paymentByFee(feeId);
    const charged = this.toNumber(fee.amount);
    const totalPaid = paid
      .filter((p) => p.status === 'active')
      .reduce((sum, p) => sum + this.toNumber(p.amount), 0);
    return {
      feeId,
      feeType: fee.feeType,
      charged: charged.toFixed(DOUBLE_PRECISION),
      paid: totalPaid.toFixed(DOUBLE_PRECISION),
      outstanding: (charged - totalPaid).toFixed(DOUBLE_PRECISION),
    };
  }

  async paymentByFee(feeId: number) {
    return this.paymentRepo.find({ where: { feeId }, order: { createdAt: 'ASC' } });
  }

  async balanceForStudent(studentId: number) {
    const fees = await this.feeRepo.find({ where: { studentId } });
    let charged = 0;
    let paid = 0;
    for (const fee of fees) {
      charged += this.toNumber(fee.amount);
      const payments = await this.paymentRepo.find({
        where: { feeId: fee.id, status: 'active' },
      });
      paid += payments.reduce((sum, p) => sum + this.toNumber(p.amount), 0);
    }
    return {
      studentId,
      totalCharged: charged.toFixed(DOUBLE_PRECISION),
      totalPaid: paid.toFixed(DOUBLE_PRECISION),
      balance: (charged - paid).toFixed(DOUBLE_PRECISION),
      cleared: (charged - paid) <= 0.001,
    };
  }

  async studentStatement(studentId: number) {
    const fees = await this.feeRepo.find({ where: { studentId }, order: { createdAt: 'ASC' } });
    const lines: Array<Record<string, unknown>> = [];
    for (const fee of fees) {
      lines.push({
        type: 'charge',
        ref: `FEE-${fee.id}`,
        description: `${fee.feeType} ${fee.academicYear}/S${fee.semester}`,
        amount: this.toNumber(fee.amount).toFixed(DOUBLE_PRECISION),
        date: fee.createdAt,
      });
      const payments = await this.paymentRepo.find({
        where: { feeId: fee.id },
        order: { paymentDate: 'ASC' },
      });
      for (const payment of payments) {
        lines.push({
          type: payment.status === 'reversed' ? 'reversal' : 'payment',
          ref: payment.paymentReference,
          description: `${payment.paymentMethod}${payment.status === 'reversed' ? ` (reversed: ${payment.reversalNote})` : ''}`,
          amount:
            payment.status === 'reversed'
              ? `-${this.toNumber(payment.amount).toFixed(DOUBLE_PRECISION)}`
              : this.toNumber(payment.amount).toFixed(DOUBLE_PRECISION),
          date: payment.paymentDate,
        });
      }
    }
    lines.sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());
    return lines;
  }
}