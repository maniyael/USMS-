import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../../common/services/audit.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.usersService.validateCredentials(dto.username, dto.password);

    const payload = { sub: user.id, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);

    const permissions =
      (await this.usersService.findOneWithPermissions(user.username))?.permissions ?? [];

    await this.auditService.log({
      action: 'auth.login',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      ipAddress,
    });

    return {
      accessToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        username: user.username,
        roleId: user.roleId,
        roleName: user.role?.name,
        linkedStudentId: user.linkedStudentId,
        linkedStaffId: user.linkedStaffId,
        permissions,
      },
    };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const match = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException('New password must be different from the current password');
    }

    await this.usersService.setPassword(userId, dto.newPassword);

    await this.auditService.log({
      action: 'auth.password_changed',
      entity: 'User',
      entityId: userId,
      userId,
      ipAddress,
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: number, ipAddress?: string): Promise<{ message: string }> {
    await this.auditService.log({
      action: 'auth.logout',
      entity: 'User',
      entityId: userId,
      userId,
      ipAddress,
    });
    return { message: 'Logged out' };
  }

  async getCurrentUserInfo(userId: number) {
    const result = await this.usersService.findOneWithPermissions((await this.usersService.findById(userId))?.username ?? '');
    if (!result) {
      throw new UnauthorizedException();
    }
    return {
      id: result.user.id,
      username: result.user.username,
      roleId: result.user.roleId,
      roleName: result.user.role?.name,
      status: result.user.status,
      mustChangePassword: result.user.mustChangePassword,
      linkedStudentId: result.user.linkedStudentId,
      linkedStaffId: result.user.linkedStaffId,
      permissions: result.permissions,
    };
  }
}