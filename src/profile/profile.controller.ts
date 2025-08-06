import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ProfileService } from './profile.service';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  // This endpoint is public, so it should not have the global controller guard.
  // We will move the guard to be applied only on protected routes.
  @Get('/doctors')
  getAllDoctors() {
    return this.profileService.getAllDoctors();
  }

  @Get('/me')
  @UseGuards(AuthGuard('jwt')) // Apply guard here
  getMyProfile(@GetUser() user) {
    return this.profileService.getMyProfile(user);
  }

  @Patch('/me')
  @UseGuards(AuthGuard('jwt')) // Apply guard here
  updateMyProfile(
    @GetUser() user,
    @Body() updateDto: UpdateDoctorProfileDto | UpdatePatientProfileDto,
  ) {
    return this.profileService.updateProfile(user, updateDto);
  }

  @Delete('/me')
  @UseGuards(AuthGuard('jwt')) // Apply guard here
  deleteMyProfile(@GetUser() user) {
    return this.profileService.deleteMyProfile(user);
  }
}