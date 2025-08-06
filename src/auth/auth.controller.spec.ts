import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DoctorSignUpDto } from './dto/doctor-signup.dto';
import { PatientSignUpDto } from './dto/patient-signup.dto';
import { Gender } from '../database/enums/gender.enum';
// import { LoginDto } from './dto/login.dto';

const mockAuthService = {
  signUpDoctor: jest.fn(),
  signUpPatient: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => expect(controller).toBeDefined());

  describe('signUpDoctor', () => {
    it('should call authService.signUpDoctor with the correct DTO', async () => {
      const doctorDto: DoctorSignUpDto = {
        name: 'Dr. House',
        email: 'house@example.com',
        password: 'password123',
        phone_number: '5551234',
        yeo:23,
        age: 45,
        gender: Gender.MALE,
        specialization: 'Diagnostics',
      };
      mockAuthService.signUpDoctor.mockResolvedValue({
        message: 'Doctor registered',
      });
      await controller.signUpDoctor(doctorDto);
      expect(service.signUpDoctor).toHaveBeenCalledWith(doctorDto);
    });
  });

  describe('signUpPatient', () => {
    it('should call authService.signUpPatient with the correct DTO', async () => {
      const patientDto: PatientSignUpDto = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone_number: '5555678',
        gender: Gender.FEMALE,
        age: 28,
        weight: 60,
      };
      mockAuthService.signUpPatient.mockResolvedValue({
        message: 'Patient registered',
      });
      await controller.signUpPatient(patientDto);
      expect(service.signUpPatient).toHaveBeenCalledWith(patientDto);
    });
  });

  // describe('login', () => {
  //   it('should call authService.login and return the result', async () => {
  //     const loginDto: LoginDto = {
  //       email: 'test@example.com',
  //       password: 'password123',
  //     };
  //     const expectedResult = { accessToken: 'mock.jwt.token' };
  //     mockAuthService.login.mockResolvedValue(expectedResult);
  //     const result = await controller.login(loginDto);
  //     expect(service.login).toHaveBeenCalledWith(loginDto);
  //     expect(result).toEqual(expectedResult);
  //   });
  // });
});
