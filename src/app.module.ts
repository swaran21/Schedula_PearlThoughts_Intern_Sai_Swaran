import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // --- THIS IS THE FIX ---
        // Get all required variables first
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<number>('DB_PORT');
        const dbUsername = configService.get<string>('DB_USERNAME');
        const dbPassword = configService.get<string>('DB_PASSWORD');
        const dbDatabase = configService.get<string>('DB_DATABASE');

        // Guard clause: Check if any of them are missing
        if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbDatabase) {
          throw new Error('One or more database environment variables are not defined.');
        }
        // -----------------------

        const isProduction = process.env.NODE_ENV === 'production';

        return {
          type: 'postgres',

          // Now we can safely use the variables
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,

          entities: [
            User,
            Doctor,
            Patient,
            Appointment,
            Slot,
            Chat,
            RecurringAvailability,
            RescheduleHistory,
          ],

          ssl: isProduction ? { rejectUnauthorized: false } : false,
          synchronize: !isProduction,
        };
      },
    }),

    // Your other application modules
    AuthModule,
    ProfileModule,
    AvailabilityModule,
    AppointmentModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}