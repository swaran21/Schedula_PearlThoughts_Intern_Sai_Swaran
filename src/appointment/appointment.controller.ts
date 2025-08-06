import { Controller, Post, Get, Param, UseGuards, Patch, Delete, Body, ParseUUIDPipe } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentController {
  getSlotsForDoctor: any;
  addAvailability: any;
  deleteSlot: any;
  constructor(private readonly appointmentService: AppointmentService) {}

  // Patient books an appointment for a given slot
  @Post()
  createAppointment(@Body() createDto: CreateAppointmentDto, @GetUser() authUser) {
    return this.appointmentService.createAppointment(createDto, authUser);
  }

  // Get appointments for the logged-in patient
  @Get('/my-appointments/patient')
  getMyPatientAppointments(@GetUser() authUser) {
    return this.appointmentService.getAppointmentsForPatient(authUser.sub, authUser);
  }

  // Get appointments for the logged-in doctor
  @Get('/my-appointments/doctor')
  getMyDoctorAppointments(@GetUser() authUser) {
    return this.appointmentService.getAppointmentsForDoctor(authUser.sub, authUser);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAppointmentStatusDto,
    @GetUser() authUser,
  ) {
    return this.appointmentService.updateAppointmentStatus(id, updateDto.status, authUser);
  }

  @Patch(':id/reschedule')
  rescheduleAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rescheduleDto: RescheduleAppointmentDto,
    @GetUser() authUser,
  ) {
    return this.appointmentService.rescheduleAppointment(id, rescheduleDto, authUser);
  }

  @Delete(':id')
  cancelAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() authUser,
  ) {
    return this.appointmentService.cancelAppointment(id, authUser);
  }

}