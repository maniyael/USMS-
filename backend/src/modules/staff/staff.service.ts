import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Staff } from './entities/staff.entity';
import { CourseAssignment } from './entities/course-assignment.entity';
import { Role } from '../admin/entities/role.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { ROLE_NAMES } from '../../seed/seed.service';
import { BCRYPT_ROUNDS } from '../users/users.service';
import { CreateStaffDto, CourseAssignDto } from './dto/staff.dto';
import { ConfigService } from '@nestjs/config';

const POSITION_ROLE_MAP: Record<string, string> = {
  lecturer: ROLE_NAMES.LECTURER,
  registrar: ROLE_NAMES.REGISTRAR,
  finance: ROLE_NAMES.FINANCE_OFFICER,
  administrative: ROLE_NAMES.REGISTRAR,
  department_head: ROLE_NAMES.ACADEMIC_ADMINISTRATOR,
};

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
    @InjectRepository(CourseAssignment)
    private readonly assignmentRepo: Repository<CourseAssignment>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async list() {
    return this.staffRepo.find({ relations: { department: true, assignments: true } });
  }

  async findOne(id: number): Promise<Staff> {
    const staff = await this.staffRepo.findOne({
      where: { id },
      relations: { department: true, assignments: true },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }
    return staff;
  }

  async create(dto: CreateStaffDto): Promise<Staff> {
    const emailExists = await this.staffRepo.findOneBy({ email: dto.email });
    if (emailExists) {
      throw new ConflictException('A staff member with this email already exists');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const staffCount = await manager.count(Staff);
      const staffId = `EMP${String(staffCount + 1).padStart(4, '0')}`;

      const staff = await manager.save(
        manager.create(Staff, {
          staffId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          departmentId: dto.departmentId,
          position: dto.position,
          qualifications: dto.qualifications,
          status: 'active',
          isLecturer: dto.isLecturer ?? dto.position.toLowerCase().includes('lecturer'),
        }),
      );

      const roleName = POSITION_ROLE_MAP[staff.position.toLowerCase()];
      const role = dto.roleId
        ? await manager.findOne(Role, { where: { id: dto.roleId } })
        : roleName
          ? await manager.findOne(Role, { where: { name: roleName } })
          : null;

      if (!role) {
        throw new BadRequestException('A valid role is required for the staff member account');
      }

      const username = await this.buildUsername(dto.firstName, dto.lastName, manager);
      const initialPassword =
        this.config.get<string>('university.initialPassword') ?? 'changeme2026@';
      const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_ROUNDS);

      await manager.save(
        manager.create(User, {
          username,
          passwordHash,
          roleId: role.id,
          linkedStaffId: staff.id,
          mustChangePassword: true,
          status: UserStatus.ACTIVE,
        }),
      );

      await queryRunner.commitTransaction();
      return staff;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async buildUsername(
    firstName: string,
    lastName: string,
    manager: EntityManager,
  ): Promise<string> {
    const base = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    let username = base;
    let counter = 1;
    while (await manager.exists(User, { where: { username } })) {
      username = `${base}.${counter}`;
      counter++;
    }
    return username;
  }

  async update(id: number, dto: Partial<CreateStaffDto>): Promise<Staff> {
    const staff = await this.findOne(id);
    Object.assign(staff, dto);
    return this.staffRepo.save(staff);
  }

  async assignCourse(dto: CourseAssignDto): Promise<CourseAssignment> {
    const staff = await this.findOne(dto.staffId);
    if (!staff.isLecturer) {
      throw new BadRequestException('Only lecturers can be assigned courses');
    }
    const existing = await this.assignmentRepo.findOneBy({
      staffId: dto.staffId,
      courseId: dto.courseId,
      academicYear: dto.academicYear,
      semester: dto.semester,
    });
    if (existing) {
      throw new ConflictException('This lecturer is already assigned to this course');
    }
    return this.assignmentRepo.save(this.assignmentRepo.create(dto));
  }

  async listAssignments(staffId?: number, academicYear?: string, semester?: number) {
    const qb = this.assignmentRepo
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.staff', 'staff')
      .leftJoinAndSelect('assignment.course', 'course')
      .orderBy('assignment.academicYear', 'DESC');

    if (staffId) {
      qb.andWhere('assignment.staff_id = :staffId', { staffId });
    }
    if (academicYear) {
      qb.andWhere('assignment.academicYear = :academicYear', { academicYear });
    }
    if (semester) {
      qb.andWhere('assignment.semester = :semester', { semester });
    }
    return qb.getMany();
  }

  async removeAssignment(id: number): Promise<void> {
    await this.assignmentRepo.delete(id);
  }
}