import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../modules/admin/entities/permission.entity';
import { Role } from '../modules/admin/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { ALL_PERMISSIONS, PermissionName } from '../constants/permissions';
import { UsersService } from '../modules/users/users.service';

export const ROLE_NAMES = {
  SUPER_ADMINISTRATOR: 'super_administrator',
  ACADEMIC_ADMINISTRATOR: 'academic_administrator',
  REGISTRAR: 'registrar',
  LECTURER: 'lecturer',
  FINANCE_OFFICER: 'finance_officer',
  STUDENT: 'student',
} as const;

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedSuperAdmin();
    this.logger.log('Seed data verified');
  }

  private async seedPermissions(): Promise<void> {
    const existing = await this.permissionRepo.find();
    const existingNames = new Set(existing.map((p) => p.name));

    const toCreate: Permission[] = [];
    for (const name of ALL_PERMISSIONS) {
      if (!existingNames.has(name)) {
        toCreate.push(this.permissionRepo.create({ name }));
      }
    }
    if (toCreate.length) {
      await this.permissionRepo.save(toCreate);
      this.logger.log(`Seeded ${toCreate.length} permissions`);
    }
  }

  private async seedRoles(): Promise<void> {
    const permissionNameToId = new Map<string, number>();
    const permissions = await this.permissionRepo.find();
    for (const p of permissions) {
      permissionNameToId.set(p.name, p.id);
    }

    const definitions: {
      name: string;
      description: string;
      permissions: PermissionName[];
    }[] = [
      {
        name: ROLE_NAMES.SUPER_ADMINISTRATOR,
        description: 'Full system access',
        permissions: ALL_PERMISSIONS as PermissionName[],
      },
      {
        name: ROLE_NAMES.ACADEMIC_ADMINISTRATOR,
        description: 'Manages academic operations',
        permissions: [
          'student.view',
          'student.create',
          'student.update',
          'academic.view',
          'academic.create',
          'academic.update',
          'course.view',
          'course.create',
          'course.update',
          'curriculum.view',
          'curriculum.create',
          'curriculum.update',
          'enrollment.view',
          'enrollment.manage',
          'staff.view',
          'attendance.view',
          'grade.view',
          'grade.validate',
          'grade.correct',
          'assessment.view',
          'assessment.manage',
          'timetable.view',
          'timetable.manage',
          'report.view',
          'notification.manage',
          'announcement.manage',
          'academic.delete',
          'course.delete',
          'curriculum.delete',
          'evaluation.view',
          'evaluation.config',
          'evaluation.analyze',
        ],
      },
      {
        name: ROLE_NAMES.REGISTRAR,
        description: 'Manages student and administrative records',
        permissions: [
          'student.view',
          'student.create',
          'student.update',
          'academic.view',
          'course.view',
          'enrollment.view',
          'enrollment.manage',
          'grade.view',
          'attendance.view',
          'document.view',
          'document.generate',
          'report.view',
          'staff.view',
          'evaluation.view',
        ],
      },
      {
        name: ROLE_NAMES.LECTURER,
        description: 'Manages assigned courses, attendance and grades',
        permissions: [
          'course.view',
          'enrollment.view',
          'attendance.manage',
          'attendance.view',
          'assessment.view',
          'assessment.manage',
          'grade.enter',
          'grade.submit',
          'grade.view',
          'timetable.view',
          'announcement.manage',
          'evaluation.view',
          'evaluation.result',
        ],
      },
      {
        name: ROLE_NAMES.FINANCE_OFFICER,
        description: 'Manages fees, payments and receipts',
        permissions: [
          'finance.view',
          'fees.manage',
          'payment.record',
          'payment.reverse',
          'receipt.generate',
          'student.view',
          'document.view',
          'document.generate',
          'report.view',
          'refund.view',
          'refund.manage',
        ],
      },
      {
        name: ROLE_NAMES.STUDENT,
        description: 'Self-service access to own records',
        permissions: [
          'student.view',
          'enrollment.view',
          'grade.view',
          'attendance.view',
          'timetable.view',
          'finance.view',
          'document.view',
          'academic.view',
          'course.view',
          'announcement.view',
          'refund.view',
          'refund.request',
          'evaluation.view',
          'evaluation.submit',
        ],
      },
    ];

    for (const def of definitions) {
      let role = await this.roleRepo.findOne({ where: { name: def.name } });
      if (!role) {
        role = this.roleRepo.create({ name: def.name, description: def.description });
      }
      const permissionIds = def.permissions
        .map((p) => permissionNameToId.get(p))
        .filter((id): id is number => id !== undefined);
      const permissionEntities = await this.permissionRepo.findBy({ id: In(permissionIds) });
      role.permissions = permissionEntities;
      await this.roleRepo.save(role);
    }
  }

  private async seedSuperAdmin(): Promise<void> {
    const role = await this.roleRepo.findOne({
      where: { name: ROLE_NAMES.SUPER_ADMINISTRATOR },
    });
    if (!role) {
      return;
    }

    const existing = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (existing) {
      return;
    }

    const initialPassword = this.config.get<string>('university.initialPassword');
    await this.usersService.create(
      { username: 'admin', roleId: role.id },
      initialPassword,
    );
    this.logger.log('Seeded Super Administrator user "admin"');
  }
}