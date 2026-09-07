import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { GpaService } from './services/gpa.service';
import { StudentIdService } from './services/student-id.service';
import { Student } from '../modules/students/entities/student.entity';
import { Cohort } from '../modules/academics/entities/cohort.entity';
import { Grade } from '../modules/grades/entities/grade.entity';
import { Enrollment } from '../modules/enrollment/entities/enrollment.entity';
import { Attendance } from '../modules/attendance/entities/attendance.entity';
import { StudentFee } from '../modules/finance/entities/student-fee.entity';
import { Payment } from '../modules/finance/entities/payment.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLog,
      Student,
      Cohort,
      Grade,
      Enrollment,
      Attendance,
      StudentFee,
      Payment,
    ]),
  ],
  providers: [AuditService, GpaService, StudentIdService],
  exports: [AuditService, GpaService, StudentIdService],
})
export class CommonModule {}