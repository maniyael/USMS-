import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  userId: number;
  username: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  linkedStudentId?: number;
  linkedStaffId?: number;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;
    if (!user) {
      return undefined as unknown as CurrentUser;
    }
    return data ? (user[data] as unknown as CurrentUser) : user;
  },
);