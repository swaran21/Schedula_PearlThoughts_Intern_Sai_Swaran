import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsNotEmpty()
  @IsString() // Can be a real UUID or a temporary "recurring-..." string
  newSlotId: string;

  // This field is REQUIRED only when newSlotId is for a recurring template
  @IsOptional()
  @IsDateString()
  date?: string;
}