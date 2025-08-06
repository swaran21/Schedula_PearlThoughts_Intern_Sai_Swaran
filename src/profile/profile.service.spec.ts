import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { ProfileService } from './profile.service';
import { User } from '../database/entities/user.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { Patient } from '../database/entities/patient.entity';
import { UserRole } from '../database/enums/user-role.enum';

type MockRepository<T extends ObjectLiteral> = {
  findOne: jest.Mock;
  findOneBy: jest.Mock;
};

const createMockRepository = <
  T extends ObjectLiteral,
>(): MockRepository<T> => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
});

describe('ProfileService', () => {
  let service: ProfileService;
  let userRepository: MockRepository<User>;
  let doctorRepository: MockRepository<Doctor>;
  let patientRepository: MockRepository<Patient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(Doctor),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    userRepository = module.get(getRepositoryToken(User));
    doctorRepository = module.get(getRepositoryToken(Doctor));
    patientRepository = module.get(getRepositoryToken(Patient));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should fetch and return a doctor profile with user relations when role is DOCTOR', async () => {
      const authUser = {
        sub: 'doctor-uuid',
        email: 'doc@a.com',
        role: UserRole.DOCTOR,
      };
      const mockDoctorProfile = {
        doctor_id: 'doc-profile-id',
        specialization: 'Cardiology',
        user: { user_id: 'doctor-uuid', name: 'Dr. House' },
      };
      doctorRepository.findOne.mockResolvedValue(mockDoctorProfile);

      const result = await service.getUserProfile(authUser);

      expect(result).toEqual(mockDoctorProfile);
      expect(doctorRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: authUser.sub },
        relations: ['user'],
      });
      expect(patientRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should fetch and return a patient profile with user and details relations when role is PATIENT', async () => {
      const authUser = {
        sub: 'patient-uuid',
        email: 'patient@a.com',
        role: UserRole.PATIENT,
      };
      const mockPatientProfile = {
        patient_id: 'patient-profile-id',
        weight: 75,
        user: { user_id: 'patient-uuid', name: 'John Smith' },
        details: { medical_history: 'None' },
      };
      patientRepository.findOne.mockResolvedValue(mockPatientProfile);

      const result = await service.getUserProfile(authUser);

      expect(result).toEqual(mockPatientProfile);
      expect(patientRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: authUser.sub },
        relations: ['user', 'details'],
      });
      expect(doctorRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should fetch and return a basic user profile for any other role', async () => {
      const authUser = {
        sub: 'admin-uuid',
        email: 'admin@a.com',
        role: UserRole.ADMIN,
      };
      const mockUserProfile = {
        user_id: 'admin-uuid',
        name: 'Admin User',
        role: 'ADMIN',
      };
      userRepository.findOneBy.mockResolvedValue(mockUserProfile);

      const result = await service.getUserProfile(authUser);

      expect(result).toEqual(mockUserProfile);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        user_id: authUser.sub,
      });
      expect(doctorRepository.findOne).not.toHaveBeenCalled();
      expect(patientRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if a doctor profile is requested but not found', async () => {
      const authUser = {
        sub: 'non-existent-uuid',
        email: 'ghost@a.com',
        role: UserRole.DOCTOR,
      };
      doctorRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserProfile(authUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if a patient profile is requested but not found', async () => {
      const authUser = {
        sub: 'non-existent-uuid',
        email: 'ghost@a.com',
        role: UserRole.PATIENT,
      };
      patientRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserProfile(authUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
