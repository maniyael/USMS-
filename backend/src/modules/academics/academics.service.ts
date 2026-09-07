import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faculty } from './entities/faculty.entity';
import { Department } from './entities/department.entity';
import { Program } from './entities/program.entity';
import { Level } from './entities/level.entity';
import { Cohort } from './entities/cohort.entity';
import { AcademicYear } from './entities/academic-year.entity';
import {
  CreateAcademicYearDto,
  CreateCohortDto,
  CreateDepartmentDto,
  CreateFacultyDto,
  CreateLevelDto,
  CreateProgramDto,
} from './dto/academics.dto';

@Injectable()
export class AcademicsService {
  constructor(
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
    @InjectRepository(AcademicYear)
    private readonly academicYearRepo: Repository<AcademicYear>,
  ) {}

  // ---- Faculties ----
  async listFaculties() {
    return this.facultyRepo.find({ relations: { departments: true } });
  }

  async createFaculty(dto: CreateFacultyDto): Promise<Faculty> {
    return this.facultyRepo.save(this.facultyRepo.create(dto));
  }

  async updateFaculty(id: number, dto: Partial<CreateFacultyDto>): Promise<Faculty> {
    const faculty = await this.facultyRepo.findOneBy({ id });
    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }
    Object.assign(faculty, dto);
    return this.facultyRepo.save(faculty);
  }

  async deleteFaculty(id: number): Promise<void> {
    const hasDepartments = await this.departmentRepo.findOneBy({ facultyId: id });
    if (hasDepartments) {
      throw new BadRequestException('Cannot delete a faculty that has departments');
    }
    await this.facultyRepo.delete(id);
  }

  // ---- Departments ----
  async listDepartments() {
    return this.departmentRepo.find({ relations: { faculty: true, programs: true } });
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    return this.departmentRepo.save(this.departmentRepo.create(dto));
  }

  async updateDepartment(id: number, dto: Partial<CreateDepartmentDto>): Promise<Department> {
    const dept = await this.departmentRepo.findOneBy({ id });
    if (!dept) {
      throw new NotFoundException('Department not found');
    }
    Object.assign(dept, dto);
    return this.departmentRepo.save(dept);
  }

  async deleteDepartment(id: number): Promise<void> {
    const hasPrograms = await this.programRepo.findOneBy({ departmentId: id });
    if (hasPrograms) {
      throw new BadRequestException('Cannot delete a department that has programs');
    }
    await this.departmentRepo.delete(id);
  }

  // ---- Programs ----
  async listPrograms() {
    return this.programRepo.find({ relations: { department: true } });
  }

  async createProgram(dto: CreateProgramDto): Promise<Program> {
    return this.programRepo.save(this.programRepo.create(dto));
  }

  async updateProgram(id: number, dto: Partial<CreateProgramDto>): Promise<Program> {
    const program = await this.programRepo.findOneBy({ id });
    if (!program) {
      throw new NotFoundException('Program not found');
    }
    Object.assign(program, dto);
    return this.programRepo.save(program);
  }

  async deleteProgram(id: number): Promise<void> {
    const hasCohorts = await this.cohortRepo.findOneBy({ programId: id });
    if (hasCohorts) {
      throw new BadRequestException('Cannot delete a program that has cohorts');
    }
    await this.programRepo.delete(id);
  }

  // ---- Levels ----
  async listLevels() {
    return this.levelRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createLevel(dto: CreateLevelDto): Promise<Level> {
    return this.levelRepo.save(this.levelRepo.create(dto));
  }

  async updateLevel(id: number, dto: Partial<CreateLevelDto>): Promise<Level> {
    const level = await this.levelRepo.findOneBy({ id });
    if (!level) {
      throw new NotFoundException('Level not found');
    }
    Object.assign(level, dto);
    return this.levelRepo.save(level);
  }

  async deleteLevel(id: number): Promise<void> {
    await this.levelRepo.delete(id);
  }

  // ---- Cohorts ----
  async listCohorts(programId?: number) {
    const where = programId ? { programId } : {};
    return this.cohortRepo.find({ where, order: { startYear: 'DESC' } });
  }

  async createCohort(dto: CreateCohortDto): Promise<Cohort> {
    const code = `${dto.code || ''}${String(dto.startYear).slice(2)}${String(dto.endYear).slice(2)}`;
    const existing = await this.cohortRepo.findOneBy({ code });
    if (existing) {
      throw new BadRequestException('This cohort already exists');
    }
    return this.cohortRepo.save(
      this.cohortRepo.create({
        ...dto,
        code,
        maxStudentNumber: dto.maxStudentNumber ?? Number(process.env.STUDENT_NUMBER_RANGE ?? 300),
      }),
    );
  }

  async updateCohort(id: number, dto: Partial<CreateCohortDto>): Promise<Cohort> {
    const cohort = await this.cohortRepo.findOneBy({ id });
    if (!cohort) {
      throw new NotFoundException('Cohort not found');
    }
    Object.assign(cohort, dto);
    return this.cohortRepo.save(cohort);
  }

  // ---- Academic Years ----
  async listAcademicYears() {
    return this.academicYearRepo.find({ order: { startYear: 'DESC' } });
  }

  async createAcademicYear(dto: CreateAcademicYearDto): Promise<AcademicYear> {
    return this.academicYearRepo.save(this.academicYearRepo.create(dto));
  }
}