import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, ObjectLiteral } from 'typeorm';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

import { AppointmentService } from './appointment.service';
import { Appointment, AppointmentStatus } from '../database/entities/appointment.entity';
import { Slot } from '../database/entities/slot.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

// Mock Repository Setup
type MockRepository<T extends ObjectLiteral> = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOneBy: jest.Mock;
  remove: jest.Mock;
};
const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

// Mock DataSource for Transactions
const mockDataSource = {
  transaction: jest.fn(),
};

describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepository: MockRepository<Appointment>;
  let dataSource: typeof mockDataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: getRepositoryToken(Appointment), useValue: createMockRepository() },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    appointmentRepository = module.get(getRepositoryToken(Appointment));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test Suite for createAppointment ---
  describe('createAppointment', () => {
        let createDto: CreateAppointmentDto;
        let mockAuthUser;
        let mockSlot: Slot;
        let mockTransactionalManager;

        beforeEach(() => {
            createDto = {
                slotId: 'slot-uuid-123',
                complaint: 'Sore throat'            };
            mockAuthUser = { sub: 'patient-uuid-789', role: UserRole.PATIENT };
            mockSlot = {
                slot_id: createDto.slotId,
                tokens_issued: 2,
                max_tokens: 10,
            } as Slot;

            // Mock the transactional manager
            mockTransactionalManager = {
                findOne: jest.fn().mockResolvedValue(mockSlot),
                save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
                create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
            };
            dataSource.transaction.mockImplementation(callback => callback(mockTransactionalManager));
        });

        it('should successfully create an appointment and increment the slot token count', async () => {
            const result = await service.createAppointment(createDto, mockAuthUser);
            
            // 1. Verify the slot's token count was incremented and saved
            expect(mockTransactionalManager.save).toHaveBeenCalledWith(expect.objectContaining({
                slot_id: createDto.slotId,
                tokens_issued: 3, // Incremented from 2
            }));

            // 2. Verify the appointment was created with the correct details
            expect(mockTransactionalManager.create).toHaveBeenCalledWith(Appointment, {
                patientUserId: mockAuthUser.sub,
                doctorUserId: mockSlot.doctorUserId,
                slot_id: createDto.slotId,
                complaint: createDto.complaint,
                token_number: 3, // The new token number (old count + 1)
            });

            // 3. Verify the new appointment was saved
            expect(mockTransactionalManager.save).toHaveBeenCalledWith(expect.objectContaining({
                complaint: 'Sore throat'
            }));
        });

        it('should throw ForbiddenException if a non-patient tries to book', async () => {
            const doctorAuthUser = { sub: 'doctor-uuid', role: UserRole.DOCTOR };
            // We don't need to mock the transaction here as it should fail before starting
            dataSource.transaction.mockImplementation(() => { throw new Error('Transaction should not be called'); });
            
            await expect(service.createAppointment(createDto, doctorAuthUser)).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException if the slot does not exist', async () => {
            // Mock the transaction to find no slot
            mockTransactionalManager.findOne.mockResolvedValue(null);
            
            await expect(service.createAppointment(createDto, mockAuthUser)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if the slot is full', async () => {
            // Make the slot full
            mockSlot.tokens_issued = 10;
            mockTransactionalManager.findOne.mockResolvedValue(mockSlot);
            
            await expect(service.createAppointment(createDto, mockAuthUser)).rejects.toThrow(ConflictException);
        });
    });
  // --- Test Suite for updateAppointmentStatus ---
  describe('updateAppointmentStatus', () => {
    const appointmentId = 'appt-uuid-123';
    const doctorId = 'doctor-uuid-456';
    const mockAuthUser = { sub: doctorId, role: UserRole.DOCTOR };

    it('should successfully update an appointment status', async () => {
      const mockAppointment = { appointment_id: appointmentId, doctorUserId: doctorId, status: AppointmentStatus.SCHEDULED };
      appointmentRepository.findOneBy.mockResolvedValue(mockAppointment);
      appointmentRepository.save.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.COMPLETED });

      const result = await service.updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED, mockAuthUser);
      
      const updatedAppointment = result as Appointment;
      
      // Assert
      expect(updatedAppointment.status).toEqual(AppointmentStatus.COMPLETED);
      expect(appointmentRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: AppointmentStatus.COMPLETED }));
    });

    it('should throw ForbiddenException if user is not the doctor of the appointment', async () => {
      const mockAppointment = { appointment_id: appointmentId, doctorUserId: 'another-doctor-id' };
      appointmentRepository.findOneBy.mockResolvedValue(mockAppointment);
      
      await expect(service.updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED, mockAuthUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      appointmentRepository.findOneBy.mockResolvedValue(null);
      await expect(service.updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED, mockAuthUser)).rejects.toThrow(NotFoundException);
    });
    
    it('should call cancelAppointment if status is updated to CANCELED', async () => {
      // We spy on the 'cancelAppointment' method to see if it's called
      const cancelSpy = jest.spyOn(service, 'cancelAppointment').mockResolvedValue({ message: 'Canceled' });

      const mockAppointment = { appointment_id: appointmentId, doctorUserId: doctorId, status: AppointmentStatus.SCHEDULED };
      appointmentRepository.findOneBy.mockResolvedValue(mockAppointment);

      await service.updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELED, mockAuthUser);
      
      expect(cancelSpy).toHaveBeenCalledWith(appointmentId, mockAuthUser);
      cancelSpy.mockRestore(); // Clean up the spy
    });
  });

  // --- Test Suite for cancelAppointment ---
  describe('cancelAppointment', () => {
    const appointmentId = 'appt-uuid-123';
    const patientId = 'patient-uuid-789';
    const mockAuthUser = { sub: patientId, role: UserRole.PATIENT };
    let mockSlot: Slot;
    let mockAppointment: Appointment;
    let mockTransactionalManager;

    beforeEach(() => {
        mockSlot = { slot_id: 'slot-123', tokens_issued: 5 } as Slot;
        mockAppointment = {
            appointment_id: appointmentId,
            patientUserId: patientId,
            doctorUserId: 'doctor-uuid-456',
            status: AppointmentStatus.SCHEDULED,
            slot: mockSlot,
        } as Appointment;
        
        // Mock the transactional manager that will be passed to the transaction callback
        mockTransactionalManager = {
            findOne: jest.fn().mockResolvedValue(mockAppointment),
            save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        // Setup the dataSource.transaction to call our test logic with the mock manager
        dataSource.transaction.mockImplementation(callback => callback(mockTransactionalManager));
    });

    it('should successfully cancel an appointment and release a token from the slot', async () => {
      const result = await service.cancelAppointment(appointmentId, mockAuthUser);
      
      expect(result).toEqual({ message: 'Appointment successfully canceled.' });
      
      // Verify that the slot's token count was decremented and saved
      expect(mockTransactionalManager.save).toHaveBeenCalledWith(expect.objectContaining({
          slot_id: 'slot-123',
          tokens_issued: 4, // Was 5, now 4
      }));
      
      // Verify that the appointment's status was updated to CANCELED and saved
      expect(mockTransactionalManager.save).toHaveBeenCalledWith(expect.objectContaining({
          appointment_id: appointmentId,
          status: AppointmentStatus.CANCELED,
      }));
    });

    it('should throw ForbiddenException if user is not part of the appointment', async () => {
        const unauthorizedUser = { sub: 'unauthorized-user-id' };
        await expect(service.cancelAppointment(appointmentId, unauthorizedUser)).rejects.toThrow(ForbiddenException);
    });

    it('should do nothing if appointment is already canceled', async () => {
        mockAppointment.status = AppointmentStatus.CANCELED;
        mockTransactionalManager.findOne.mockResolvedValue(mockAppointment);

        const result = await service.cancelAppointment(appointmentId, mockAuthUser);
        expect(result).toEqual({ message: 'Appointment was already canceled.' });
        // Ensure save was NOT called again
        expect(mockTransactionalManager.save).not.toHaveBeenCalled();
    });
  });
  
  describe('rescheduleAppointment', () => {
    const appointmentId = 'appt-uuid-123';
    const patientId = 'patient-uuid-789';
    const mockAuthUser = { sub: patientId, role: UserRole.PATIENT };
    const oldSlotId = 'old-slot-uuid';
    const newSlotId = 'new-slot-uuid';
    let rescheduleDto: RescheduleAppointmentDto;
    let mockAppointment: Appointment;
    let mockOldSlot: Slot;
    let mockNewSlot: Slot;
    let mockTransactionalManager;

    beforeEach(() => {
        // Keep the DTO and entity creation here
        rescheduleDto = { newSlotId };
        mockOldSlot = { slot_id: oldSlotId, tokens_issued: 5 } as Slot;
        mockNewSlot = { slot_id: newSlotId, tokens_issued: 2, max_tokens: 10 } as Slot;
        mockAppointment = {
            appointment_id: appointmentId,
            patientUserId: patientId,
            slot_id: oldSlotId,
            status: AppointmentStatus.SCHEDULED,
        } as Appointment;

        // Create the mock manager but DON'T set mock implementations yet
        mockTransactionalManager = {
            findOne: jest.fn(),
            save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
        };
        dataSource.transaction.mockImplementation(callback => callback(mockTransactionalManager));
    });

    it('should successfully reschedule an appointment', async () => {
        // Arrange: Set mocks specifically for this test
        mockTransactionalManager.findOne
            .mockResolvedValueOnce(mockAppointment)
            .mockResolvedValueOnce(mockNewSlot)
            .mockResolvedValueOnce(mockOldSlot);
        
        // Act & Assert
        const result = await service.rescheduleAppointment(appointmentId, rescheduleDto, mockAuthUser);
        expect(result.slot_id).toBe(newSlotId);
        // ... (other assertions for the success case)
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
        // Arrange: Only need to mock the first findOne call
        mockTransactionalManager.findOne.mockResolvedValueOnce(mockAppointment);
        
        // Act & Assert
        const unauthorizedUser = { sub: 'another-patient-id' };
        await expect(service.rescheduleAppointment(appointmentId, rescheduleDto, unauthorizedUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if appointment is not in SCHEDULED status', async () => {
        // Arrange
        mockAppointment.status = AppointmentStatus.COMPLETED;
        mockTransactionalManager.findOne.mockResolvedValueOnce(mockAppointment);
        
        // Act & Assert
        await expect(service.rescheduleAppointment(appointmentId, rescheduleDto, mockAuthUser)).rejects.toThrow(ConflictException);
    });

    // --- THE FIX IS HERE ---
    it('should throw NotFoundException if the new slot does not exist', async () => {
        // Arrange: Mock the exact sequence for this test case
        // 1. Find the appointment (succeeds)
        mockTransactionalManager.findOne.mockResolvedValueOnce(mockAppointment);
        // 2. Find the new slot (fails by returning null)
        mockTransactionalManager.findOne.mockResolvedValueOnce(null);
        
        // Act & Assert
        await expect(service.rescheduleAppointment(appointmentId, rescheduleDto, mockAuthUser)).rejects.toThrow(NotFoundException);
    });
    
    it('should throw ConflictException if the new slot is full', async () => {
        // Arrange
        mockNewSlot.tokens_issued = 10; // Make the slot full
        mockTransactionalManager.findOne
            .mockResolvedValueOnce(mockAppointment)
            .mockResolvedValueOnce(mockNewSlot);

        // Act & Assert
        await expect(service.rescheduleAppointment(appointmentId, rescheduleDto, mockAuthUser)).rejects.toThrow(ConflictException);
    });
});

});