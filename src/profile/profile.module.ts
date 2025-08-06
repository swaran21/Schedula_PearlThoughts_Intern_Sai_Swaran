import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module'; // <-- IMPORTANT
import { Doctor } from 'src/database/entities/doctor.entity';
import { Patient } from 'src/database/entities/patient.entity';
import { User } from 'src/database/entities/user.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User, Doctor, Patient]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
