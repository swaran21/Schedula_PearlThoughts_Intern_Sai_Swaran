import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from '../database/entities/user.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { Patient } from '../database/entities/patient.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { DoctorSignUpDto } from './dto/doctor-signup.dto';
import { PatientSignUpDto } from './dto/patient-signup.dto';
import { LoginDto } from './dto/login.dto';

type CreateUserInput = Partial<User> & { password: string };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    private jwtService: JwtService,
  ) {}

  //patient register
  async signUpPatient(patientSignUpDto: PatientSignUpDto): Promise<{ message: string }> {
    const { name, email, password, phone_number, gender, age, weight } = patientSignUpDto;

    const user = await this.createUser({
      name, email, password, phone: phone_number, age, gender,
      role: UserRole.PATIENT,
    });

    // CHANGED: Logic is simpler now
    const patientProfile = this.patientRepository.create({
      user_id: user.user_id, // Directly use the user's ID
      weight,
    });
    await this.patientRepository.save(patientProfile);

    return { message: 'Patient successfully registered.' };
  }


  //doctor register
   async signUpDoctor(doctorSignUpDto: DoctorSignUpDto): Promise<{ message: string }> {
    const {
      name, email, password, phone_number, gender, age,yeo,
      specialization, services, availability_schedule,
    } = doctorSignUpDto;

    const user = await this.createUser({
      name, email, password, phone: phone_number, age, gender,
      role: UserRole.DOCTOR,
    });

    // CHANGED: Logic is simpler now
    const doctorProfile = this.doctorRepository.create({
      user_id: user.user_id, // Directly use the user's ID
      yeo,
      specialization,
      services: services || [],
      availability_schedule: availability_schedule || {},
    });
    await this.doctorRepository.save(doctorProfile);

    return { message: 'Doctor successfully registered.' };
  }

  //validation
  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload = { sub: user.user_id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }

  //single user creation
  private async createUser(userData: CreateUserInput): Promise<User> {
    const { password, ...userDetails } = userData;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      ...userDetails,
      password: hashedPassword,
    });

    try {
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email already exists.');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred during user creation.');
      }
    }
  }
}