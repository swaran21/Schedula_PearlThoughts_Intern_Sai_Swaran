import {
  IsArray,
  isArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  Min,
} from 'class-validator';
import { Gender } from '../../database/enums/gender.enum';

export class DoctorSignUpDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @IsNotEmpty()
  @IsNumber()
  age: number;

  @IsNotEmpty()
  @IsEnum(Gender, { message: 'Gender must be male, female, or other' })
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  // NEW: Added yeo for doctor signup
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  yeo: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Ensures each item in the array is a string
  services?: string[];
  
  @IsNotEmpty()
  @IsString()
  specialization: string;

  @IsOptional()
  @IsObject()
  availability_schedule?: any;
}
