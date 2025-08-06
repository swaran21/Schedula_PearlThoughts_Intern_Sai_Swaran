import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Slot } from '../database/entities/slot.entity';
import { CreateSlotDto } from './dto/create-slot.dto';
import { RecurringAvailability } from '../database/entities/recurring-availability.entity';
import { Appointment } from '../database/entities/appointment.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Slot) private slotRepository: Repository<Slot>,
    @InjectRepository(RecurringAvailability) private recurringRepository: Repository<RecurringAvailability>,
    @InjectRepository(Appointment) private appointmentRepository: Repository<Appointment>,
  ) {}

  async addAvailability(doctorUserId: string, authUserId: string, createDto: CreateSlotDto) {
    if (doctorUserId !== authUserId) {
      throw new ForbiddenException('You can only add availability for yourself.');
    }

    const { date, weekdays, ...slotDetails } = createDto;

    // Priority Logic 1: Date is provided, creating a one-time override slot.
    if (date) {
      const newSlot = this.slotRepository.create({ ...slotDetails, date, doctorUserId });
      return this.slotRepository.save(newSlot);
    }
    
    // Priority Logic 2: Only weekdays are provided, creating recurring templates.
    if (weekdays && weekdays.length > 0) {
      await this.recurringRepository.delete({ doctorUserId, weekday: In(weekdays), session: slotDetails.session });
      const templatesToSave = weekdays.map(day => this.recurringRepository.create({ ...slotDetails, weekday: day, doctorUserId }));
      const savedTemplates = await this.recurringRepository.save(templatesToSave);

      // Transform the response to be consistent with the GET endpoint
      const today = new Date().toISOString().split('T')[0];
      return savedTemplates.map(template => ({
          slot_id: `recurring-${template.recurring_availability_id}`,
          doctorUserId: template.doctorUserId,
          date: today,
          session: template.session,
          start_time: template.start_time,
          end_time: template.end_time,
          max_tokens: template.max_tokens,
          tokens_issued: 0,
          is_active: true,
      }));
    }

    throw new BadRequestException('Either a date or at least one weekday must be provided.');
  }

  async getRecurringSlotsForDoctor(doctorUserId: string) {
    return this.recurringRepository.find({
      where: { doctorUserId },
      order: { weekday: 'ASC', session: 'ASC', start_time: 'ASC' }
    });
  }

  async getSlotsForDoctor(doctorUserId: string, date: string) {
    const requestedDate = new Date(date);
    const weekday = requestedDate.getUTCDay();

    // 1. Find specific, one-time slots for the date. These take top priority.
    const oneTimeSlots = await this.slotRepository.find({
      where: { doctorUserId, date, is_active: true },
    });

    if (oneTimeSlots.length > 0) {
      return oneTimeSlots;
    }

    // 2. If no overrides, find the recurring template for that day of the week.
    const recurringTemplates = await this.recurringRepository.find({
      where: { doctorUserId, weekday },
    });
    
    // 3. To provide an accurate `tokens_issued`, count existing appointments for that day against slots
    const appointmentsOnDate = await this.appointmentRepository.find({
        where: { doctorUserId, slot: { date } } // This requires a relation on Appointment to Slot
    });

    // 4. Convert recurring templates into concrete, bookable Slot-like objects.
    return recurringTemplates.map(template => {
        const bookedCount = appointmentsOnDate.filter(apt => apt.slot.start_time === template.start_time && apt.slot.session === template.session).length;
        return {
            slot_id: `recurring-${template.recurring_availability_id}`,
            doctorUserId: template.doctorUserId,
            date: date,
            session: template.session,
            start_time: template.start_time,
            end_time: template.end_time,
            max_tokens: template.max_tokens,
            tokens_issued: bookedCount,
            is_active: true,
        };
    });
  }
  
  async deleteSlot(slotId: string, authUserId: string) {
     if (slotId.startsWith('recurring-')) {
    const recurringId = slotId.replace('recurring-', '');
    const recurring = await this.recurringRepository.findOneBy({ recurring_availability_id: recurringId });
    if (!recurring) throw new NotFoundException('Recurring slot not found.');
    if (recurring.doctorUserId !== authUserId) throw new ForbiddenException('You can only delete your own recurring slots.');
    await this.recurringRepository.remove(recurring);
    return { message: 'Recurring slot deleted successfully.' };
     }
    else{
    const slot = await this.slotRepository.findOneBy({ slot_id: slotId });
    if (!slot) throw new NotFoundException('Specific slot not found.');
    if (slot.doctorUserId !== authUserId) throw new ForbiddenException('You can only delete your own slots.');
    if (slot.tokens_issued > 0) throw new ConflictException('Cannot delete a slot with active appointments.');
    await this.slotRepository.remove(slot);
    return { message: 'Slot deleted successfully.' };
    }
  }
}