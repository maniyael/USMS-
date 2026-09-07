import { IsInt, IsOptional, IsString, IsBoolean, IsArray, MaxLength, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  credits: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;
}

export class CurriculumCourseDto {
  @IsInt()
  courseId: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsInt()
  prerequisiteCourseId?: number;
}

export class CreateCurriculumDto {
  @IsInt()
  programId: number;

  @IsInt()
  levelId: number;

  @IsString()
  academicYear: string;

  @IsInt()
  semester: number;

  @IsOptional()
  @IsArray()
  courses?: CurriculumCourseDto[];
}