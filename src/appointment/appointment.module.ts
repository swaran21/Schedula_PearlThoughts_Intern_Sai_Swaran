import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Appointment } from '../database/entities/appointment.entity';
import { Slot } from '../database/entities/slot.entity';
import { AuthModule } from '../auth/auth.module';
import { RecurringAvailability } from '../database/entities/recurring-availability.entity';

@Module({
  imports: [
    // Make the Appointment and Slot entities available
    TypeOrmModule.forFeature([Appointment, Slot, RecurringAvailability]),
    // Import AuthModule to use the AuthGuard
    AuthModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}