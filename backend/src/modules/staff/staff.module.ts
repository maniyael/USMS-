import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { CourseAssignment } from './entities/course-assignment.entity';
import { Role } from '../admin/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Staff, CourseAssignment, Role, User]),
  ],
  providers: [StaffService],
  controllers: [StaffController],
  exports: [StaffService],
})
export class StaffModule {}