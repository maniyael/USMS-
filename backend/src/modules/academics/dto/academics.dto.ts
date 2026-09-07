import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFacultyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;
}

export class UpdateFacultyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code?: string;
}

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @IsInt()
  facultyId: number;
}

export class CreateProgramDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @IsInt()
  departmentId: number;
}

export class CreateLevelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateCohortDto {
  @IsInt()
  programId: number;

  @IsInt()
  startYear: number;

  @IsInt()
  endYear: number;

  @IsString()
  @MaxLength(10)
  code: string;

  @IsOptional()
  @IsInt()
  maxStudentNumber?: number;
}

export class CreateAcademicYearDto {
  @IsString()
  @MaxLength(20)
  name: string;

  @IsInt()
  startYear: number;

  @IsInt()
  endYear: number;
}