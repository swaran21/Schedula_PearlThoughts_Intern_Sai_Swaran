import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { AvailabilityService } from './availability.service';
import { Slot } from '../database/entities/slot.entity';
import { CreateSlotDto } from './dto/create-slot.dto';

// Mock Repository Setup
type MockRepository<T extends ObjectLiteral> = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
};

const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let slotRepository: MockRepository<Slot>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: getRepositoryToken(Slot), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    slotRepository = module.get(getRepositoryToken(Slot));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test Suite for getSlotsForDoctor ---
  describe('getSlotsForDoctor', () => {
    it('should find and return slots for a given doctor ID', async () => {
      const doctorId = 'doctor-uuid-123';
      const mockSlots = [{ slot_id: 'slot-1' }, { slot_id: 'slot-2' }];
      slotRepository.find.mockResolvedValue(mockSlots);
      const date = '2027-08-12';

      const result = await service.getSlotsForDoctor(doctorId,date);

      expect(result).toEqual(mockSlots);
      expect(slotRepository.find).toHaveBeenCalledWith({
        where: { doctorUserId: doctorId, is_active: true },
        order: { date: 'ASC', start_time: 'ASC' },
      });
    });

    it('should include a date filter if provided', async () => {
      const doctorId = 'doctor-uuid-123';
      const date = '2025-07-20';
      await service.getSlotsForDoctor(doctorId, date);

      expect(slotRepository.find).toHaveBeenCalledWith({
        where: { doctorUserId: doctorId, is_active: true, date: date },
        order: { date: 'ASC', start_time: 'ASC' },
      });
    });
  });

  // --- Test Suite for addSlot ---
  describe('addSlot', () => {
    const doctorId = 'doctor-uuid-123';
    const authUserId = 'doctor-uuid-123';
    let createSlotDto: CreateSlotDto;

    beforeEach(() => {
      createSlotDto = {
        date: '2025-07-20',
        session: 'Morning',
        start_time: '10:00',
        end_time: '12:00',
        max_tokens: 10,
      };
    });

    it('should create and save a new slot successfully', async () => {
      slotRepository.create.mockReturnValue(createSlotDto);
      slotRepository.save.mockResolvedValue({
        slot_id: 'new-slot-id',
        ...createSlotDto,
      });

      const result = await service.addAvailability(doctorId, authUserId, createSlotDto);

      expect(result).toBeDefined();
      expect(slotRepository.create).toHaveBeenCalledWith({
        ...createSlotDto,
        doctorUserId: doctorId,
      });
      expect(slotRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user tries to add slot for another doctor', async () => {
      const otherDoctorId = 'other-doctor-uuid';
      await expect(
        service.addAvailability(otherDoctorId, authUserId, createSlotDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // --- Test Suite for deleteSlot ---
  describe('deleteSlot', () => {
    const slotId = 'slot-to-delete-uuid';
    const authUserId = 'doctor-owner-uuid';

    it('should successfully delete an unbooked slot', async () => {
      const mockSlot = {
        slot_id: slotId,
        doctorUserId: authUserId,
        tokens_issued: 0,
      };
      slotRepository.findOne.mockResolvedValue(mockSlot);

      await service.deleteSlot(slotId, authUserId);

      expect(slotRepository.remove).toHaveBeenCalledWith(mockSlot);
    });

    it('should throw NotFoundException if slot does not exist', async () => {
      slotRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteSlot(slotId, authUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the owner of the slot', async () => {
      const mockSlot = {
        slot_id: slotId,
        doctorUserId: 'another-doctor-id',
        tokens_issued: 0,
      };
      slotRepository.findOne.mockResolvedValue(mockSlot);

      await expect(service.deleteSlot(slotId, authUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if the slot has active appointments', async () => {
      const mockSlot = {
        slot_id: slotId,
        doctorUserId: authUserId,
        tokens_issued: 1,
      };
      slotRepository.findOne.mockResolvedValue(mockSlot);

      await expect(service.deleteSlot(slotId, authUserId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});