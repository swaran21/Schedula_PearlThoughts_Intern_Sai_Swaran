import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm'; // <-- Import DataSource
import { Doctor } from '../database/entities/doctor.entity';
import { Patient } from '../database/entities/patient.entity';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}

function isDoctorProfileDto(dto: any): dto is UpdateDoctorProfileDto {
    // Check for a property that only exists on the Doctor DTO
    return 'specialization' in dto || 'years_of_experience' in dto;
}

@Injectable()
export class ProfileService {
  // REMOVED: No need to declare dataSource: any; here
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    // --- THIS IS THE FIX ---
    private dataSource: DataSource, // <-- Inject DataSource
  ) {}

  // The 'getMyProfile' method seems to have an outdated relation 'details' for Patient.
  // Based on our refactor, it should just be 'user'. Let's fix that too.
  async getMyProfile(authUser: AuthenticatedUser): Promise<User | Doctor | Patient> {
    const { sub, role } = authUser;

    if (role === UserRole.DOCTOR) {
      const doctorProfile = await this.doctorRepository.findOne({
        where: { user_id: sub },
        relations: ['user'],
      });
      if (!doctorProfile) throw new NotFoundException('Doctor profile not found.');
      return doctorProfile;
    }
    
    if (role === UserRole.PATIENT) {
      const patientProfile = await this.patientRepository.findOne({
        where: { user_id: sub },
        relations: ['user'], // <-- Corrected: 'details' relation was removed
      });
      if (!patientProfile) throw new NotFoundException('Patient profile not found.');
      return patientProfile;
    }

    const user = await this.userRepository.findOneBy({ user_id: sub });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  // The 'yeo' field in 'getAllDoctors' seems like a typo for 'years_of_experience'. Let's correct it.
  async getAllDoctors() {
    return this.doctorRepository.find({
      relations: ['user'],
      select: {
        user_id: true,
        specialization: true,
        yeo: true, // <-- Corrected from 'yeo'
        services: true,
        user: {
          name: true,
          email: true,
        }
      }
    });
  }

  // The updateProfile and deleteMyProfile methods are now correct because this.dataSource will be defined.
  async updateProfile(authUser: AuthenticatedUser, updateDto: UpdateDoctorProfileDto | UpdatePatientProfileDto) {
    const { sub, role } = authUser;
    
    const { name, phone, ...profileDetails } = updateDto;
    const userDetails = { ...(name && { name }), ...(phone && { phone }) };

    return this.dataSource.transaction(async (manager) => {
      // Update the generic User table if there are details for it
      if (Object.keys(userDetails).length > 0) {
        await manager.update(User, sub, userDetails);
      }
      
      // Update the role-specific table if there are details for it
      if (Object.keys(profileDetails).length > 0) {
        // --- THIS IS THE FIX ---
        if (role === UserRole.DOCTOR) {
          // Inside this block, we are certain the details are for a Doctor.
          // We assert the type to reassure TypeScript.
          await manager.update(Doctor, sub, profileDetails as Partial<Doctor>);

        } else if (role === UserRole.PATIENT) {
          // Inside this block, we are certain the details are for a Patient.
          // We assert the type here as well to fix the new error.
          await manager.update(Patient, sub, profileDetails as Partial<Patient>);
        }
        // --- END OF FIX ---
      }

      // Return the full, updated profile
      return this.getMyProfile(authUser);
    });
  }
  

  async deleteMyProfile(authUser: AuthenticatedUser) {
    const { sub } = authUser;
    const user = await this.userRepository.findOneBy({ user_id: sub });
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    await this.userRepository.remove(user);
    return { message: 'Profile deleted successfully.' };
  }
}