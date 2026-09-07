import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from './entities/assessment.entity';
import { Grade } from './entities/grade.entity';
import { GradeHistory } from './entities/grade-history.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, Grade, GradeHistory, Course, Enrollment])],
  providers: [GradesService],
  controllers: [GradesController],
  exports: [GradesService],
})
export class GradesModule {}