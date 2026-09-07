import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/admin/entities/role.entity';
import { Permission } from '../modules/admin/entities/permission.entity';
import { Student } from '../modules/students/entities/student.entity';
import { Staff } from '../modules/staff/entities/staff.entity';
import { CourseAssignment } from '../modules/staff/entities/course-assignment.entity';
import { Faculty } from '../modules/academics/entities/faculty.entity';
import { Department } from '../modules/academics/entities/department.entity';
import { Program } from '../modules/academics/entities/program.entity';
import { Level } from '../modules/academics/entities/level.entity';
import { Cohort } from '../modules/academics/entities/cohort.entity';
import { AcademicYear } from '../modules/academics/entities/academic-year.entity';
import { Course } from '../modules/courses/entities/course.entity';
import { Curriculum } from '../modules/courses/entities/curriculum.entity';
import { CurriculumCourse } from '../modules/courses/entities/curriculum-course.entity';
import { Enrollment } from '../modules/enrollment/entities/enrollment.entity';
import { Attendance } from '../modules/attendance/entities/attendance.entity';
import { Assessment } from '../modules/grades/entities/assessment.entity';
import { Grade } from '../modules/grades/entities/grade.entity';
import { GradeHistory } from '../modules/grades/entities/grade-history.entity';
import { TimetableEntry } from '../modules/timetable/entities/timetable-entry.entity';
import { StudentFee } from '../modules/finance/entities/student-fee.entity';
import { Payment } from '../modules/finance/entities/payment.entity';
import { Receipt } from '../modules/finance/entities/receipt.entity';
import { StudentDocument } from '../modules/documents/entities/student-document.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Announcement } from '../modules/notifications/entities/announcement.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.database'),
        entities: [
          User,
          Role,
          Permission,
          Student,
          Staff,
          CourseAssignment,
          Faculty,
          Department,
          Program,
          Level,
          Cohort,
          AcademicYear,
          Course,
          Curriculum,
          CurriculumCourse,
          Enrollment,
          Attendance,
          Assessment,
          Grade,
          GradeHistory,
          TimetableEntry,
          StudentFee,
          Payment,
          Receipt,
          StudentDocument,
          Notification,
          Announcement,
          AuditLog,
        ],
        synchronize: false,
        migrationsRun: false,
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}