import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { Student } from '../students/entities/student.entity';
import { Staff } from '../staff/entities/staff.entity';
import { Course } from '../courses/entities/course.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { StudentFee } from '../finance/entities/student-fee.entity';
import { Payment } from '../finance/entities/payment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Program } from '../academics/entities/program.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment,
      Student,
      Staff,
      Course,
      Attendance,
      StudentFee,
      Payment,
      Grade,
      Program,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}