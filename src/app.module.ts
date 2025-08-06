import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './datasource';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentModule } from './appointment/appointment.module';

// Import ALL your entities here
import { User } from './database/entities/user.entity';
import { Doctor } from './database/entities/doctor.entity';
import { Patient } from './database/entities/patient.entity';
import { Appointment } from './database/entities/appointment.entity';
import { Slot } from './database/entities/slot.entity';
import { Chat } from './database/entities/chat.entity';
import { RescheduleHistory } from './database/entities/reschedule-history.entity';
import { RecurringAvailability } from './database/entities/recurring-availability.entity';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    
    // Configure TypeOrmModule with an explicit list of ALL entities
    TypeOrmModule.forRoot({
      ...dataSourceOptions, // Keep your connection details
      entities: [ // Override the entities property to be explicit
        User,
        Doctor,
        Patient,
        Appointment,
        Slot,
        Chat,
        RecurringAvailability,
        RescheduleHistory,
      ],
    }),
    
    AuthModule,
    ProfileModule,
    AvailabilityModule,
    AppointmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}