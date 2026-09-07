import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Faculty } from '../academics/entities/faculty.entity';
import { Department } from '../academics/entities/department.entity';
import { Program } from '../academics/entities/program.entity';
import { Level } from '../academics/entities/level.entity';
import { Cohort } from '../academics/entities/cohort.entity';
import { Role } from '../admin/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Curriculum } from '../courses/entities/curriculum.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Faculty,
      Department,
      Program,
      Level,
      Cohort,
      Role,
      User,
      Curriculum,
      Enrollment,
    ]),
  ],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [StudentsService],
})
export class StudentsModule {}