import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { CoursesModule } from './modules/courses/courses.module';
import { StudentsModule } from './modules/students/students.module';
import { StaffModule } from './modules/staff/staff.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GradesModule } from './modules/grades/grades.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { FinanceModule } from './modules/finance/finance.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import databaseConfig from './config/database.config';
import securityConfig from './config/security.config';
import universityConfig from './config/university.config';
import { SeedService } from './seed/seed.service';
import { Permission } from './modules/admin/entities/permission.entity';
import { Role } from './modules/admin/entities/role.entity';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, securityConfig, universityConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    CommonModule,
    AuditModule,
    AuthModule,
    UsersModule,
    AdminModule,
    AcademicsModule,
    CoursesModule,
    StudentsModule,
    StaffModule,
    EnrollmentModule,
    AttendanceModule,
    GradesModule,
    TimetableModule,
    FinanceModule,
    DocumentsModule,
    NotificationsModule,
    ReportsModule,
    EvaluationsModule,
    TypeOrmModule.forFeature([Permission, Role, User]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    SeedService,
  ],
})
export class AppModule {}