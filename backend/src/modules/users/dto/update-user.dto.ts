import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export enum UserStatusUpdate {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
}

export class UpdateUserDto {
  @IsOptional()
  @IsInt()
  roleId?: number;

  @IsOptional()
  @IsString()
  status?: UserStatusUpdate;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}