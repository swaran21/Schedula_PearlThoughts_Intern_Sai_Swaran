import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { Slot } from '../database/entities/slot.entity';
import { AuthModule } from '../auth/auth.module';
import { RecurringAvailability } from '../database/entities/recurring-availability.entity'; // <-- Import the entity
import { Appointment } from '../database/entities/appointment.entity';

@Module({
  imports: [
    // Make the Slot entity available within this module's scope
    TypeOrmModule.forFeature([Slot, 
        RecurringAvailability, 
        Appointment ]),
    // Import AuthModule to use the AuthGuard and other exported providers
    AuthModule,
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}