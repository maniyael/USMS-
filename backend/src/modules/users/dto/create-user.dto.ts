import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsInt()
  roleId: number;

  @IsOptional()
  @IsInt()
  linkedStudentId?: number;

  @IsOptional()
  @IsInt()
  linkedStaffId?: number;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}