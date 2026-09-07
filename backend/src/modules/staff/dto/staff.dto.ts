import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsInt()
  departmentId: number;

  @IsString()
  @MaxLength(100)
  position: string;

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  @IsBoolean()
  isLecturer?: boolean;

  @IsOptional()
  @IsInt()
  roleId?: number;
}

export class CourseAssignDto {
  @IsInt()
  staffId: number;

  @IsInt()
  courseId: number;

  @IsString()
  academicYear: string;

  @IsInt()
  semester: number;
}