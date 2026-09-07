import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Student } from '../../modules/students/entities/student.entity';
import { Cohort } from '../../modules/academics/entities/cohort.entity';

export interface StudentIdComponents {
  startYear2: string;
  endYear2: string;
  number: number;
}

@Injectable()
export class StudentIdService {
  private readonly logger = new Logger(StudentIdService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Cohort)
    private readonly cohortRepo: Repository<Cohort>,
    private readonly dataSource: DataSource,
  ) {}

  buildCohortCode(startYear: number, endYear: number): string {
    return `${String(startYear).slice(2)}${String(endYear).slice(2)}`;
  }

  buildStudentId(cohortCode: string, number: number): string {
    return `${cohortCode}i${String(number).padStart(3, '0')}`;
  }

  parseStudentIdParts(studentId: string): StudentIdComponents | null {
    const match = /^(\d{2})(\d{2})i(\d{3})$/.exec(studentId);
    if (!match) {
      return null;
    }
    return {
      startYear2: match[1],
      endYear2: match[2],
      number: parseInt(match[3], 10),
    };
  }

  buildInstitutionalEmail(firstName: string, lastName: string, cohortCode: string, domain: string): string {
    const raw = `${firstName}${lastName}${cohortCode}@${domain}`;
    const normalized = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, '')
      .replace(/\.+/g, '.');
    return normalized;
  }

  async nextStudentNumber(cohortId: number, cohortCode: string, maxNumber: number): Promise<number> {
    const prefix = `${cohortCode}i`;
    const pattern = `${prefix}%`;

    const rows = await this.studentRepo
      .createQueryBuilder('student')
      .select('student.studentId', 'studentId')
      .where('student.studentId LIKE :pattern', { pattern })
      .getRawMany<{ studentId: string }>();

    const usedNumbers = new Set<number>();
    let max = 0;
    for (const row of rows) {
      const parsed = this.parseStudentIdParts(row.studentId);
      if (parsed) {
        usedNumbers.add(parsed.number);
        max = Math.max(max, parsed.number);
      }
    }

    for (let i = 1; i <= maxNumber; i++) {
      if (!usedNumbers.has(i)) {
        return i;
      }
    }
    throw new Error(
      `No available student numbers remain for cohort ${cohortCode} (limit ${maxNumber})`,
    );
  }

  async generateStudentId(
    cohortId: number,
    startYear: number,
    endYear: number,
    maxNumber: number,
  ): Promise<{ studentId: string; cohortCode: string }> {
    const cohortCode = this.buildCohortCode(startYear, endYear);
    const number = await this.nextStudentNumber(cohortId, cohortCode, maxNumber);
    return { studentId: this.buildStudentId(cohortCode, number), cohortCode };
  }
}