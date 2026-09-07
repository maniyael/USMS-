import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faculty } from './entities/faculty.entity';
import { Department } from './entities/department.entity';
import { Program } from './entities/program.entity';
import { Level } from './entities/level.entity';
import { Cohort } from './entities/cohort.entity';
import { AcademicYear } from './entities/academic-year.entity';
import { AcademicsService } from './academics.service';
import { AcademicsController } from './academics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Faculty, Department, Program, Level, Cohort, AcademicYear])],
  providers: [AcademicsService],
  controllers: [AcademicsController],
  exports: [AcademicsService],
})
export class AcademicsModule {}