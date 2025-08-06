import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { Weekday } from '../../database/entities/recurring-availability.entity';

export class CreateSlotDto {
  
  @IsOptional()
  @IsDateString()
  @ValidateIf(o => !o.weekdays || o.weekdays.length === 0)
  @IsNotEmpty({ message: 'Either date or weekdays must be provided.' })
  date?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  @ValidateIf(o => !o.date)
  @IsNotEmpty({ message: 'Either date or weekdays must be provided.' })
  weekdays?: Weekday[];

  @IsNotEmpty()
  @IsString()
  session: string; // e.g., "Morning" or "Evening"
  
  @IsNotEmpty()
  @IsString() // Using string for "HH:mm" format
  start_time: string; // e.g., "10:00"

  @IsNotEmpty()
  @IsString()
  end_time: string; // e.g., "12:00"
  
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  max_tokens: number;
}