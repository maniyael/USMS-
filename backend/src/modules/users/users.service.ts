import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export const BCRYPT_ROUNDS = 12;
export const MAX_FAILED_LOGINS = 5;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username }, relations: { role: true } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id }, relations: { role: true } });
  }

  async findOneWithPermissions(username: string): Promise<{
    user: User;
    permissions: string[];
  } | null> {
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      return null;
    }
    const permissions = (user.role?.permissions ?? []).map((p) => p.name);
    return { user, permissions };
  }

  async create(dto: CreateUserDto, initialPassword?: string): Promise<User> {
    const password = dto.password ?? initialPassword ?? 'changeme2026@';
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({
      username: dto.username,
      passwordHash,
      roleId: dto.roleId,
      linkedStudentId: dto.linkedStudentId,
      linkedStaffId: dto.linkedStaffId,
      mustChangePassword: dto.mustChangePassword ?? true,
      status: UserStatus.ACTIVE,
    });
    return this.usersRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.roleId !== undefined) {
      user.roleId = dto.roleId;
    }
    if (dto.status !== undefined) {
      user.status = dto.status as unknown as UserStatus;
    }
    if (dto.mustChangePassword !== undefined) {
      user.mustChangePassword = dto.mustChangePassword;
    }
    return this.usersRepo.save(user);
  }

  async setPassword(userId: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersRepo.update(userId, {
      passwordHash,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async resetPassword(userId: number, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.setPassword(userId, newPassword);
    await this.usersRepo.update(userId, { mustChangePassword: true });
  }

  async validateCredentials(username: string, password: string): Promise<User> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.LOCKED && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await this.registerFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.resetFailedLogins(user.id);
    await this.usersRepo.update(user.id, { lastLoginAt: new Date() });
    return user;
  }

  private async registerFailedLogin(user: User): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    const update: Partial<User> = { failedLoginAttempts: attempts };

    if (attempts >= MAX_FAILED_LOGINS) {
      update.status = UserStatus.LOCKED;
      update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      update.failedLoginAttempts = 0;
    }
    await this.usersRepo.update(user.id, update);
  }

  private async resetFailedLogins(userId: number): Promise<void> {
    await this.usersRepo.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async findRecentlyCreated(createdAtThreshold: Date): Promise<User[]> {
    return this.usersRepo.find({ where: { createdAt: MoreThan(createdAtThreshold) } });
  }
}