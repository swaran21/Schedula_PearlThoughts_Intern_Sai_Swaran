import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '../../database/entities/appointment.entity';

export class UpdateAppointmentStatusDto {
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}