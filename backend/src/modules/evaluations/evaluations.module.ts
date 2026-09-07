import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationCriterion } from './entities/evaluation-criterion.entity';
import { EvaluationPeriod } from './entities/evaluation-period.entity';
import { CourseEvaluation } from './entities/course-evaluation.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { CourseAssignment } from '../staff/entities/course-assignment.entity';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationCriterion,
      EvaluationPeriod,
      CourseEvaluation,
      Enrollment,
      CourseAssignment,
    ]),
  ],
  providers: [EvaluationsService],
  controllers: [EvaluationsController],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}