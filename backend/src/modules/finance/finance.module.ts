import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentFee } from './entities/student-fee.entity';
import { Payment } from './entities/payment.entity';
import { Receipt } from './entities/receipt.entity';
import { Student } from '../students/entities/student.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StudentFee, Payment, Receipt, Student])],
  providers: [FinanceService],
  controllers: [FinanceController],
  exports: [FinanceService],
})
export class FinanceModule {}