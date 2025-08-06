import { IsArray, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  name?: string; // On the User table

  @IsOptional()
  @IsString()
  phone?: string; // On the User table

  @IsOptional()
  @IsString()
  specialization?: string; // On the Doctor table

  @IsOptional()
  @IsInt()
  @Min(0)
  years_of_experience?: number; // On the Doctor table

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[]; // On the Doctor table

  @IsOptional()
  @IsObject()
  availability_schedule?: any; // On the Doctor table
}