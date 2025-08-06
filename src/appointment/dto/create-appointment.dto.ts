import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  slotId: string;

  @IsNotEmpty()
  @IsString()
  complaint: string;

  // This field is ONLY needed when booking a recurring slot
  @IsOptional()
  @IsDateString()
  date?: string;
}