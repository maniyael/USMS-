import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Curriculum } from './entities/curriculum.entity';
import { CurriculumCourse } from './entities/curriculum-course.entity';
import { CreateCourseDto, CreateCurriculumDto, CurriculumCourseDto } from './dto/courses.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Curriculum)
    private readonly curriculumRepo: Repository<Curriculum>,
    @InjectRepository(CurriculumCourse)
    private readonly curriculumCourseRepo: Repository<CurriculumCourse>,
  ) {}

  // ---- Courses ----
  async listCourses() {
    return this.courseRepo.find({ order: { code: 'ASC' } });
  }

  async findCourse(id: number): Promise<Course> {
    const course = await this.courseRepo.findOneBy({ id });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async createCourse(dto: CreateCourseDto): Promise<Course> {
    const existing = await this.courseRepo.findOneBy({ code: dto.code });
    if (existing) {
      throw new BadRequestException(`Course code ${dto.code} already exists`);
    }
    return this.courseRepo.save(this.courseRepo.create(dto));
  }

  async updateCourse(id: number, dto: Partial<CreateCourseDto>): Promise<Course> {
    const course = await this.findCourse(id);
    Object.assign(course, dto);
    return this.courseRepo.save(course);
  }

  async deleteCourse(id: number): Promise<void> {
    await this.findCourse(id);
    await this.courseRepo.delete(id);
  }

  // ---- Curricula ----
  async listCurricula(programId?: number, levelId?: number, academicYear?: string) {
    const qb = this.curriculumRepo
      .createQueryBuilder('curriculum')
      .leftJoinAndSelect('curriculum.program', 'program')
      .leftJoinAndSelect('curriculum.level', 'level')
      .leftJoinAndSelect('curriculum.courses', 'courses')
      .leftJoinAndSelect('courses.course', 'course')
      .orderBy('curriculum.academicYear', 'DESC');

    if (programId) {
      qb.andWhere('curriculum.program_id = :programId', { programId });
    }
    if (levelId) {
      qb.andWhere('curriculum.level_id = :levelId', { levelId });
    }
    if (academicYear) {
      qb.andWhere('curriculum.academicYear = :academicYear', { academicYear });
    }
    return qb.getMany();
  }

  async findCurriculum(id: number): Promise<Curriculum> {
    const curriculum = await this.curriculumRepo.findOne({
      where: { id },
      relations: { program: true, level: true, courses: { course: true } },
    });
    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }
    return curriculum;
  }

  async createCurriculum(dto: CreateCurriculumDto): Promise<Curriculum> {
    await this.assertUniqueCurriculum(dto.programId, dto.levelId, dto.academicYear, dto.semester);

    const curriculum = this.curriculumRepo.create({
      programId: dto.programId,
      levelId: dto.levelId,
      academicYear: dto.academicYear,
      semester: dto.semester,
    });
    const saved = await this.curriculumRepo.save(curriculum);

    if (dto.courses?.length) {
      saved.courses = await this.curriculumCourseRepo.save(
        dto.courses.map((c) => this.curriculumCourseRepo.create({ ...c, curriculumId: saved.id })),
      );
    }
    return this.findCurriculum(saved.id);
  }

  async updateCurriculumCourses(
    curriculumId: number,
    courses: CurriculumCourseDto[],
  ): Promise<Curriculum> {
    await this.findCurriculum(curriculumId);
    await this.curriculumCourseRepo.delete({ curriculumId });

    if (courses.length) {
      const unique = new Map<number, CurriculumCourseDto>();
      for (const c of courses) {
        if (!unique.has(c.courseId)) {
          unique.set(c.courseId, c);
        }
      }
      await this.curriculumCourseRepo.save(
        Array.from(unique.values()).map((c) =>
          this.curriculumCourseRepo.create({ ...c, curriculumId }),
        ),
      );
    }
    return this.findCurriculum(curriculumId);
  }

  async deleteCurriculum(id: number): Promise<void> {
    await this.curriculumCourseRepo.delete({ curriculumId: id });
    await this.curriculumRepo.delete(id);
  }

  async findCoursesForCurriculum(
    programId: number,
    levelId: number,
    academicYear: string,
    semester: number,
  ): Promise<Course[]> {
    const curriculum = await this.curriculumRepo.findOne({
      where: { programId, levelId, academicYear, semester },
      relations: { courses: { course: true } },
    });
    if (!curriculum) {
      return [];
    }
    return curriculum.courses.map((cc) => cc.course);
  }

  private async assertUniqueCurriculum(
    programId: number,
    levelId: number,
    academicYear: string,
    semester: number,
  ): Promise<void> {
    const existing = await this.curriculumRepo.findOneBy({
      programId,
      levelId,
      academicYear,
      semester,
    });
    if (existing) {
      throw new BadRequestException(
        'A curriculum already exists for this program/level/academic year/semester',
      );
    }
  }
}