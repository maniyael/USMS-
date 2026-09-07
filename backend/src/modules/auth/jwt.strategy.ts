import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('security.jwtSecret') ?? 'usms-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUser> {
    const result = await this.usersService.findOneWithPermissions(payload.username);
    if (!result) {
      throw new UnauthorizedException('User no longer exists');
    }
    return {
      userId: result.user.id,
      username: result.user.username,
      roleId: result.user.roleId,
      roleName: result.user.role?.name ?? '',
      permissions: result.permissions,
      linkedStudentId: result.user.linkedStudentId ?? undefined,
      linkedStaffId: result.user.linkedStaffId ?? undefined,
    };
  }
}