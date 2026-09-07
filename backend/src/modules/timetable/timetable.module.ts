import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetableEntry } from './entities/timetable-entry.entity';
import { Course } from '../courses/entities/course.entity';
import { Staff } from '../staff/entities/staff.entity';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimetableEntry, Course, Staff])],
  providers: [TimetableService],
  controllers: [TimetableController],
  exports: [TimetableService],
})
export class TimetableModule {}