import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DoctorSignUpDto } from './dto/doctor-signup.dto';
import { PatientSignUpDto } from './dto/patient-signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/patient/register')
  signUpPatient(
    @Body(ValidationPipe) patientSignUpDto: PatientSignUpDto,
  ): Promise<{ message: string }> {
    return this.authService.signUpPatient(patientSignUpDto);
  }

  @Post('/doctor/register')
  signUpDoctor(
    @Body(ValidationPipe) doctorSignUpDto: DoctorSignUpDto,
  ): Promise<{ message: string }> {
    return this.authService.signUpDoctor(doctorSignUpDto);
  }

  @Post('/login')
  login(@Body(ValidationPipe) loginDto: LoginDto): Promise<{ accessToken:string }> {
    return this.authService.login(loginDto);
  }
}
