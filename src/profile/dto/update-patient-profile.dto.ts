import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePatientProfileDto {
  @IsOptional()
  @IsString()
  name?: string; // On the User table

  @IsOptional()
  @IsString()
  phone?: string; // On the User table

  @IsOptional()
  @IsNumber()
  weight?: number; // On the Patient table

  @IsOptional()
  @IsNumber()
  height?: number; // On the Patient table

  @IsOptional()
  @IsString()
  medical_history?: string; // On the Patient table
}