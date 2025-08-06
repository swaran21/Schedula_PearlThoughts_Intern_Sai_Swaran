import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from '../auth/auth.service';
import { User } from '../database/entities/user.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { Patient } from '../database/entities/patient.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { DoctorSignUpDto } from '../auth/dto/doctor-signup.dto';
import { PatientSignUpDto } from '../auth/dto/patient-signup.dto';
import { Gender } from '../database/enums/gender.enum';
import { LoginDto } from '../auth/dto/login.dto';

jest.mock('bcrypt');

// --- THE FIX IS HERE ---
// Define the MockRepository type with explicit, non-optional properties for the methods we use.
type MockRepository<T extends ObjectLiteral> = {
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
};

// This helper function already matches the corrected type, so no changes are needed here.
const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});
// --- END OF FIX ---

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: MockRepository<User>;
  let doctorRepository: MockRepository<Doctor>;
  let patientRepository: MockRepository<Patient>;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        { provide: getRepositoryToken(Doctor), useValue: createMockRepository() },
        { provide: getRepositoryToken(Patient), useValue: createMockRepository() },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    doctorRepository = module.get(getRepositoryToken(Doctor));
    patientRepository = module.get(getRepositoryToken(Patient));
    jwtService = module.get(JwtService);
  });

  // ... THE REST OF YOUR TEST FILE IS PERFECT AND NEEDS NO CHANGES ...
  it('should be defined', () => expect(authService).toBeDefined());

  // --- Doctor Signup Tests ---
  describe('signUpDoctor', () => {
    let doctorSignUpDto: DoctorSignUpDto;
    beforeEach(() => {
      doctorSignUpDto = {
        name: 'Dr. Strange',
        email: 'strange@example.com',
        password: 'password123',
        phone_number: '1234567890',
        age: 40,
        yeo: 20,
        gender: Gender.MALE,
        specialization: 'Sorcery',
        services: ['Time Manipulation'],
        availability_schedule: { "monday": "9-5" }
      };
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    });

    it('should successfully sign up a doctor', async () => {
      const mockUser = { user_id: 'doctor-uuid' };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      doctorRepository.create.mockReturnValue({});
      doctorRepository.save.mockResolvedValue({});

      await authService.signUpDoctor(doctorSignUpDto);

      const result = await authService.signUpDoctor(doctorSignUpDto);
      expect(result).toEqual({ message: 'Doctor successfully registered.' });

      expect(userRepository.create).toHaveBeenCalledWith({
        name: doctorSignUpDto.name, email: doctorSignUpDto.email, password: 'hashedPassword',
        phone: doctorSignUpDto.phone_number, age: doctorSignUpDto.age, gender: doctorSignUpDto.gender,
        role: UserRole.DOCTOR,
      });

      expect(doctorRepository.create).toHaveBeenCalledWith({
        user_id: mockUser.user_id,
        specialization: doctorSignUpDto.specialization,
        years_of_experience: doctorSignUpDto.yeo, // <-- Assert the new field
        services: doctorSignUpDto.services,
        availability_schedule: doctorSignUpDto.availability_schedule,
      });
    });

    it('should throw ConflictException if email exists', async () => {
      userRepository.save.mockRejectedValue({ code: '23505' });
      await expect(authService.signUpDoctor(doctorSignUpDto)).rejects.toThrow(ConflictException);
    });
  });

  // --- Patient Signup Tests ---
  describe('signUpPatient', () => {
    let patientSignUpDto: PatientSignUpDto;
    beforeEach(() => {
      patientSignUpDto = {
        name: 'John Doe', email: 'john.doe@example.com', password: 'password123',
        phone_number: '0987654321', age: 30, gender: Gender.MALE, weight: 80,
      };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    });

    it('should successfully sign up a patient', async () => {
      const mockUser = { user_id: 'patient-uuid' };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      patientRepository.create.mockReturnValue({});
      patientRepository.save.mockResolvedValue({});

      const result = await authService.signUpPatient(patientSignUpDto);
      expect(result).toEqual({ message: 'Patient successfully registered.' });

      expect(userRepository.create).toHaveBeenCalledWith({
        name: patientSignUpDto.name, email: patientSignUpDto.email, password: 'hashedPassword',
        phone: patientSignUpDto.phone_number, age: patientSignUpDto.age, gender: patientSignUpDto.gender,
        role: UserRole.PATIENT,
      });

      expect(patientRepository.create).toHaveBeenCalledWith({
        user_id: mockUser.user_id, weight: patientSignUpDto.weight,
      });
    });
  });

  // --- Login Tests ---
  describe('login', () => {
    let loginDto: LoginDto;
    let mockUser: User;
    beforeEach(() => {
      loginDto = { email: 'test@example.com', password: 'correctpassword' };
      mockUser = {
        user_id: 'some-uuid', email: loginDto.email, password: 'hashedCorrectPassword', role: UserRole.PATIENT,
      } as User;
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return an access token on successful login', async () => {
      (userRepository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const mockToken = 'mock.jwt.token';
      jwtService.sign.mockReturnValue(mockToken);

      const result = await authService.login(loginDto);
      expect(result).toEqual({ accessToken: mockToken });
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      (userRepository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
