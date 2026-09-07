import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student, AcademicStatus } from './entities/student.entity';
import { Faculty } from '../academics/entities/faculty.entity';
import { Department } from '../academics/entities/department.entity';
import { Program } from '../academics/entities/program.entity';
import { Level } from '../academics/entities/level.entity';
import { Cohort } from '../academics/entities/cohort.entity';
import { Role } from '../admin/entities/role.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { Enrollment, EnrollmentStatus } from '../enrollment/entities/enrollment.entity';
import { Curriculum } from '../courses/entities/curriculum.entity';
import { StudentFee } from '../finance/entities/student-fee.entity';
import { BCRYPT_ROUNDS } from '../users/users.service';
import { ROLE_NAMES } from '../../seed/seed.service';
import { CreateStudentDto, QueryStudentsDto, UpdateStudentDto } from './dto/students.dto';
import { StudentIdService } from '../../common/services/student-id.service';

export interface StudentProfile {
  student: Student;
  summary: {
    semesterGpa: number;
    cumulativeGpa: number;
    creditsAttempted: number;
    creditsEarned: number;
    attendancePercentage: number | null;
    totalFees: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  grades: unknown[];
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Faculty)
    private readonly facultyRepo: Repository<Faculty>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
    @InjectRepository(Cohort)
    private readonly cohortRepo: Repository<Cohort>,
    private readonly dataSource: DataSource,
    private readonly studentIdService: StudentIdService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateStudentDto): Promise<Student> {
    const domain = this.config.get<string>('university.domain') ?? 'university.edu';
    const initialPassword =
      this.config.get<string>('university.initialPassword') ?? 'changeme2026@';
    const maxNumber = Number(this.config.get<string | number>('university.studentNumberRange') ?? 300);

    const faculty = await this.getEntity(this.facultyRepo, dto.facultyId, 'Faculty');
    const department = await this.getEntity(this.departmentRepo, dto.departmentId, 'Department');
    const program = await this.getEntity(this.programRepo, dto.programId, 'Program');
    const level = await this.getEntity(this.levelRepo, dto.levelId, 'Level');
    const cohort = await this.getEntity(this.cohortRepo, dto.cohortId, 'Cohort');

    if (cohort.programId !== program.id) {
      throw new BadRequestException('The selected cohort does not belong to the selected program');
    }
    if (program.departmentId !== department.id) {
      throw new BadRequestException('The selected program does not belong to the selected department');
    }
    if (department.facultyId !== faculty.id) {
      throw new BadRequestException('The selected department does not belong to the selected faculty');
    }

    const academicYear =
      dto.academicYear ?? `${cohort.startYear}/${cohort.endYear}`;
    const semester = dto.semester ?? 1;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.createInTransaction({
          dto,
          domain,
          initialPassword,
          cohort,
          level,
          academicYear,
          semester,
          maxNumber,
        });
      } catch (error) {
        const isUniqueViolation =
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code: string }).code === '23505';
        if (!isUniqueViolation || attempt === 2) {
          throw error;
        }
      }
    }
    throw new BadRequestException('Could not generate a unique Student ID, please retry');
  }

  private async createInTransaction(params: {
    dto: CreateStudentDto;
    domain: string;
    initialPassword: string;
    cohort: Cohort;
    level: Level;
    academicYear: string;
    semester: number;
    maxNumber: number;
  }): Promise<Student> {
    const { dto, domain, initialPassword, cohort, level, academicYear, semester, maxNumber } = params;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      // Serialize ID generation per cohort row without loading eager relations
      await manager.query('SELECT id FROM cohorts WHERE id = $1 FOR UPDATE', [cohort.id]);
      const lockedCohort = await manager.findOne(Cohort, { where: { id: cohort.id } });
      if (!lockedCohort) {
        throw new NotFoundException('Cohort not found');
      }

      const { studentId, cohortCode } = await this.studentIdService.generateStudentId(
        lockedCohort.id,
        lockedCohort.startYear,
        lockedCohort.endYear,
        maxNumber,
      );

      const institutionalEmail = this.studentIdService.buildInstitutionalEmail(
        dto.firstName,
        dto.lastName,
        cohortCode,
        domain,
      );

      const emailExists = await manager.exists(Student, {
        where: { institutionalEmail },
      });
      if (emailExists) {
        throw new ConflictException(
          `Institutional email ${institutionalEmail} is already in use. Please flag this collision for administrative handling.`,
        );
      }

      const student = await manager.save(
        manager.create(Student, {
          studentId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          profilePhoto: dto.profilePhoto,
          nationality: dto.nationality,
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
          institutionalEmail,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactRelationship: dto.emergencyContactRelationship,
          emergencyContactPhone: dto.emergencyContactPhone,
          programId: dto.programId,
          levelId: dto.levelId,
          cohortId: dto.cohortId,
          academicStatus: AcademicStatus.ACTIVE,
          enrollmentDate: dto.enrollmentDate ?? new Date().toISOString().slice(0, 10),
        }),
      );

      const studentRole = await manager.findOne(Role, { where: { name: ROLE_NAMES.STUDENT } });
      if (!studentRole) {
        throw new NotFoundException('Student role not configured');
      }

      const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_ROUNDS);
      await manager.save(
        manager.create(User, {
          username: student.studentId,
          passwordHash,
          roleId: studentRole.id,
          linkedStudentId: student.id,
          mustChangePassword: true,
          status: UserStatus.ACTIVE,
        }),
      );

      // Associate predefined curriculum courses
      const curriculum = await manager.findOne(Curriculum, {
        where: { programId: dto.programId, levelId: dto.levelId, academicYear, semester },
        relations: { courses: { course: true } },
      });
      if (curriculum) {
        await manager.save(
          curriculum.courses.map((cc) =>
            manager.create(Enrollment, {
              studentId: student.id,
              courseId: cc.courseId,
              academicYear,
              semester,
              enrollmentStatus: EnrollmentStatus.ENROLLED,
              attemptNumber: 1,
            }),
          ),
        );
      }

      await queryRunner.commitTransaction();
      return student;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async list(query: QueryStudentsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 25, 100);

    const qb = this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.program', 'program')
      .leftJoinAndSelect('student.level', 'level')
      .leftJoinAndSelect('student.cohort', 'cohort')
      .orderBy('student.createdAt', 'DESC');

    if (query.search) {
      const search = `%${query.search}%`;
      qb.andWhere(
        '(student.studentId ILIKE :search OR student.firstName ILIKE :search OR student.lastName ILIKE :search)',
        { search },
      );
    }
    if (query.programId) {
      qb.andWhere('student.program_id = :programId', { programId: query.programId });
    }
    if (query.levelId) {
      qb.andWhere('student.level_id = :levelId', { levelId: query.levelId });
    }
    if (query.cohortId) {
      qb.andWhere('student.cohort_id = :cohortId', { cohortId: query.cohortId });
    }
    if (query.academicStatus) {
      qb.andWhere('student.academic_status = :academicStatus', {
        academicStatus: query.academicStatus,
      });
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async findById(id: number): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: { program: true, level: true, cohort: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async findByStudentId(studentId: string): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { studentId },
      relations: { program: true, level: true, cohort: true },
    });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }
    return student;
  }

  async update(id: number, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findById(id);
    const { levelId, academicStatus, ...fields } = dto;
    Object.assign(student, fields);
    if (levelId) {
      const level = await this.getEntity(this.levelRepo, levelId, 'Level');
      student.level = level;
      student.levelId = level.id;
    }
    if (academicStatus) {
      student.academicStatus = academicStatus as AcademicStatus;
    }
    // Institutional email, student ID and enrollment date are never auto-modified here.
    return this.studentRepo.save(student);
  }

  async setAcademicStatus(id: number, status: AcademicStatus): Promise<Student> {
    const student = await this.findById(id);
    student.academicStatus = status;
    return this.studentRepo.save(student);
  }

  async remove(id: number): Promise<void> {
    const student = await this.findById(id);
    // Student IDs are never recycled; soft-delete via status only.
    student.academicStatus = AcademicStatus.WITHDRAWN;
    await this.studentRepo.save(student);
  }

  // ---- Dashboard / aggregate helpers ----
  async getDashboardStats() {
    const total = await this.studentRepo.count();
    const [active, graduated, suspended, withdrawn, repeating] = await Promise.all([
      this.studentRepo.count({ where: { academicStatus: AcademicStatus.ACTIVE } }),
      this.studentRepo.count({ where: { academicStatus: AcademicStatus.GRADUATED } }),
      this.studentRepo.count({ where: { academicStatus: AcademicStatus.SUSPENDED } }),
      this.studentRepo.count({ where: { academicStatus: AcademicStatus.WITHDRAWN } }),
      this.studentRepo.count({ where: { academicStatus: AcademicStatus.REPEATING } }),
    ]);
    return { total, active, graduated, suspended, withdrawn, repeating };
  }

  private async getEntity<T extends { id: number }>(
    repo: Repository<T>,
    id: number,
    name: string,
  ): Promise<T> {
    const entity = await repo.findOneBy({ id } as never);
    if (!entity) {
      throw new NotFoundException(`${name} not found`);
    }
    return entity;
  }
}