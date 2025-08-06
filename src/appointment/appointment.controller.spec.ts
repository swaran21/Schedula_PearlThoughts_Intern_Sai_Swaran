import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { UserRole } from '../database/enums/user-role.enum';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentStatus } from '../database/entities/appointment.entity';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

// Mock AppointmentService
const mockAppointmentService = {
  createAppointment: jest.fn(),
  getAppointmentsForPatient: jest.fn(),
  getAppointmentsForDoctor: jest.fn(),
  updateAppointmentStatus: jest.fn(),
  cancelAppointment: jest.fn(),
  rescheduleAppointment: jest.fn(),
};

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let service: typeof mockAppointmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService },
      ],
    })
    // Override the real AuthGuard with a mock that always allows access for unit tests
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AppointmentController>(AppointmentController);
    service = module.get(AppointmentService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAppointment', () => {
    it('should call the service to create an appointment with the correct DTO and user', async () => {
      // Arrange
      const createDto: CreateAppointmentDto = { slotId: 'slot-uuid-123', complaint: 'Fever'};
      const mockAuthUser = { sub: 'patient-uuid', role: UserRole.PATIENT };
      const mockResult = { appointment_id: 'new-appointment-id', token_number: 1 };
      
      service.createAppointment.mockResolvedValue(mockResult);

      // Act
      const result = await controller.createAppointment(createDto, mockAuthUser);

      // Assert
      expect(service.createAppointment).toHaveBeenCalledWith(createDto, mockAuthUser);
      expect(result).toEqual(mockResult);
    });
  });
  
  // --- Test for updateStatus endpoint ---
  describe('updateStatus', () => {
    it('should call the service to update appointment status', async () => {
      const appointmentId = 'appt-uuid-123';
      const mockAuthUser = { sub: 'user-uuid', role: UserRole.DOCTOR };
      const updateDto: UpdateAppointmentStatusDto = { status: AppointmentStatus.COMPLETED };
      const mockResult = { appointment_id: appointmentId, status: AppointmentStatus.COMPLETED };

      service.updateAppointmentStatus.mockResolvedValue(mockResult);

      const result = await controller.updateStatus(appointmentId, updateDto, mockAuthUser);
      
      expect(service.updateAppointmentStatus).toHaveBeenCalledWith(appointmentId, updateDto.status, mockAuthUser);
      expect(result).toEqual(mockResult);
    });
  });

  // --- Test for cancelAppointment endpoint ---
  describe('cancelAppointment', () => {
    it('should call the service to cancel an appointment', async () => {
      const appointmentId = 'appt-uuid-123';
      const mockAuthUser = { sub: 'user-uuid', role: UserRole.PATIENT };
      const mockResult = { message: 'Appointment successfully canceled.' };

      service.cancelAppointment.mockResolvedValue(mockResult);

      const result = await controller.cancelAppointment(appointmentId, mockAuthUser);
      
      expect(service.cancelAppointment).toHaveBeenCalledWith(appointmentId, mockAuthUser);
      expect(result).toEqual(mockResult);
    });
  });

  describe('rescheduleAppointment', () => {
    it('should call the service with appointmentId, DTO, and authUser', async () => {
      // Arrange
      const appointmentId = 'appt-to-reschedule-uuid';
      const rescheduleDto: RescheduleAppointmentDto = { newSlotId: 'new-slot-uuid' };
      const mockAuthUser = { sub: 'patient-uuid', role: UserRole.PATIENT };
      const mockResult = { appointment_id: appointmentId, slot_id: 'new-slot-uuid' };
      
      service.rescheduleAppointment.mockResolvedValue(mockResult);

      // Act
      const result = await controller.rescheduleAppointment(appointmentId, rescheduleDto, mockAuthUser);

      // Assert
      // 1. Check that the service was called with the correct parameters
      expect(service.rescheduleAppointment).toHaveBeenCalledWith(appointmentId, rescheduleDto, mockAuthUser);
      // 2. Check that the controller returned the result from the service
      expect(result).toEqual(mockResult);
    });
  });

  // --- Other existing tests for create and get appointments would go here ---
});