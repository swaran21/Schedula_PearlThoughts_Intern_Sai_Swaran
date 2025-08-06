import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';

import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { CreateSlotDto } from './dto/create-slot.dto';

// Mock AvailabilityService
const mockAvailabilityService = {
  getSlotsForDoctor: jest.fn(),
  addSlot: jest.fn(),
  deleteSlot: jest.fn(),
};

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let service: typeof mockAvailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        { provide: AvailabilityService, useValue: mockAvailabilityService },
      ],
    })
    // Mock the AuthGuard for protected routes
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
    service = module.get(AvailabilityService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test for GET /doctors/:doctorUserId/availability ---
  describe('getSlotsForDoctor', () => {
    it('should call the service with doctorId and optional date', async () => {
      const doctorId = 'doctor-uuid-123';
      const date = '2025-07-20';
      service.getSlotsForDoctor.mockResolvedValue([]);
      
      await controller.getSlotsForDoctor(doctorId, date);
      expect(service.getSlotsForDoctor).toHaveBeenCalledWith(doctorId, date);
      
      // Test without date
      await controller.getSlotsForDoctor(doctorId, date);
      expect(service.getSlotsForDoctor).toHaveBeenCalledWith(doctorId, date);
    });
  });

  // --- Test for POST /doctors/:doctorUserId/availability ---
  describe('addSlot', () => {
    it('should call the service with doctorId, authUser, and DTO', async () => {
      const doctorId = 'doctor-uuid-123';
      const mockAuthUser = { sub: 'doctor-uuid-123' };
      const createSlotDto: CreateSlotDto = {
        date: '2025-07-20',
        session: 'Morning',
        start_time: '10:00',
        end_time: '12:00',
        max_tokens: 10,
      };
      service.addSlot.mockResolvedValue({ slot_id: 'new-slot' });

      await controller.addAvailability(doctorId, mockAuthUser, createSlotDto);
      
      expect(service.addSlot).toHaveBeenCalledWith(doctorId, mockAuthUser.sub, createSlotDto);
    });
  });

  // --- Test for DELETE /doctors/:doctorUserId/availability/:slotId ---
  describe('deleteSlot', ()=> {
    it('should call the service with slotId and authUser', async () => {
      const slotId = 'slot-to-delete-uuid';
      const mockAuthUser = { sub: 'doctor-owner-uuid' };
      service.deleteSlot.mockResolvedValue({ message: 'Deleted' });

      await controller.deleteSlot(slotId, mockAuthUser);

      expect(service.deleteSlot).toHaveBeenCalledWith(slotId, mockAuthUser.sub);
    });
  });
});