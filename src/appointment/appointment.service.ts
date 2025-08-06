import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment, AppointmentStatus } from '../database/entities/appointment.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Slot } from '../database/entities/slot.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { RecurringAvailability } from '../database/entities/recurring-availability.entity';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Injectable()
export class AppointmentService {
  static createAppointment: any;
  static rescheduleAppointment: any;
  static getSlotsForDoctor: any;
  static addSlot: any;
  static deleteSlot: any;
  constructor(
    @InjectRepository(Appointment) private appointmentRepository: Repository<Appointment>,
    // You need to inject this repository to use it
    @InjectRepository(RecurringAvailability) private recurringRepository: Repository<RecurringAvailability>, 
    private dataSource: DataSource,
  ) {}

  async createAppointment(createDto: CreateAppointmentDto, authUser) {
    if (authUser.role !== UserRole.PATIENT) {
      throw new ForbiddenException('Only patients can book appointments.');
    }
    // We now require a 'date' in the DTO for recurring bookings
    const { slotId, complaint, date } = createDto; 
    
    return this.dataSource.transaction(async (manager) => {
      const transactionalSlotRepo = manager.getRepository(Slot);
      const transactionalRecurringRepo = manager.getRepository(RecurringAvailability);
      const transactionalAppointmentRepo = manager.getRepository(Appointment);

      let slotToBook: Slot;

      if (slotId.startsWith('recurring-')) {
        if (!date) {
          throw new BadRequestException('A date is required when booking a recurring template.');
        }

        const recurringId = slotId.replace('recurring-', '');
        const template = await transactionalRecurringRepo.findOneBy({ recurring_availability_id: recurringId });
        if (!template) {
          throw new NotFoundException(`Recurring availability template with ID ${recurringId} not found.`);
        }
        
        let existingSlot = await transactionalSlotRepo.findOne({
            where: { doctorUserId: template.doctorUserId, date, session: template.session },
            lock: { mode: 'pessimistic_write' },
        });

        if (existingSlot) {
            slotToBook = existingSlot;
        } else {
            slotToBook = transactionalSlotRepo.create({
                doctorUserId: template.doctorUserId, date, session: template.session,
                start_time: template.start_time, end_time: template.end_time,
                max_tokens: template.max_tokens, tokens_issued: 0,
            });
        }
      } else {
        const foundSlot = await transactionalSlotRepo.findOne({
          where: { slot_id: slotId }, lock: { mode: 'pessimistic_write' },
        });
        if (!foundSlot) throw new NotFoundException(`The selected slot with ID ${slotId} does not exist.`);
        slotToBook = foundSlot;
      }
      
      if (slotToBook.tokens_issued >= slotToBook.max_tokens) {
        throw new ConflictException('Sorry, this slot is fully booked.');
      }
      
      slotToBook.tokens_issued += 1;
      const savedSlot = await transactionalSlotRepo.save(slotToBook);

      const newAppointment = transactionalAppointmentRepo.create({
        patientUserId: authUser.sub,
        doctorUserId: savedSlot.doctorUserId,
        slot_id: savedSlot.slot_id,
        complaint,
        token_number: savedSlot.tokens_issued,
      });
      
      return transactionalAppointmentRepo.save(newAppointment);
    });
  }

  
  // ... (The rest of the file: getAppointmentsForPatient, getAppointmentsForDoctor, updateAppointmentStatus, cancelAppointment)
  // Your other methods are already well-written and don't need changes.
  // Including them here for completeness.
  
  async getAppointmentsForPatient(patientUserId: string, authUser) {
    if (patientUserId !== authUser.sub) throw new ForbiddenException('You can only view your own appointments.');
    return this.appointmentRepository.find({
        where: { patientUserId },
        relations: ['doctor', 'doctor.user', 'slot'],
        order: { created_at: 'DESC' }
    });
  }

  async getAppointmentsForDoctor(doctorUserId: string, authUser) {
    if (doctorUserId !== authUser.sub) throw new ForbiddenException('You can only view your own appointments.');
    return this.appointmentRepository.find({
        where: { doctorUserId },
        relations: ['patient', 'patient.user', 'slot'],
        order: { created_at: 'DESC' }
    });
  }

  async updateAppointmentStatus(appointmentId: string, newStatus: AppointmentStatus, authUser) {
    const appointment = await this.appointmentRepository.findOneBy({ appointment_id: appointmentId });
    if (!appointment) throw new NotFoundException('Appointment not found.');
    if (appointment.doctorUserId !== authUser.sub) throw new ForbiddenException('Only the doctor can update the appointment status.');
    if (appointment.status === AppointmentStatus.CANCELED) throw new ConflictException('Cannot change the status of a canceled appointment.');

    if (newStatus === AppointmentStatus.CANCELED) {
        return this.cancelAppointment(appointmentId, authUser);
    }
    
    appointment.status = newStatus;
    return this.appointmentRepository.save(appointment);
  }

  async rescheduleAppointment(
    appointmentId: string,
    rescheduleDto: RescheduleAppointmentDto,
    authUser,
  ) {
    const { newSlotId, date } = rescheduleDto;

    return this.dataSource.transaction(async (manager) => {
      const transactionalAppointmentRepo = manager.getRepository(Appointment);
      const transactionalSlotRepo = manager.getRepository(Slot);
      const transactionalRecurringRepo = manager.getRepository(RecurringAvailability);

      const appointment = await transactionalAppointmentRepo.findOne({
        where: { appointment_id: appointmentId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!appointment) throw new NotFoundException('Appointment to reschedule not found.');
      if (appointment.patientUserId !== authUser.sub) throw new ForbiddenException('You can only reschedule your own appointments.');
      if (appointment.status !== AppointmentStatus.SCHEDULED) throw new ConflictException('Only scheduled appointments can be rescheduled.');

      const oldSlotId = appointment.slot_id;

      // --- COMPLETE LOGIC IMPLEMENTED HERE ---
      let newSlotToBook: Slot;

      if (newSlotId.startsWith('recurring-')) {
        if (!date) {
          throw new BadRequestException('A date is required when rescheduling to a recurring slot.');
        }

        const recurringId = newSlotId.replace('recurring-', '');
        const template = await transactionalRecurringRepo.findOneBy({ recurring_availability_id: recurringId });
        if (!template) {
          throw new NotFoundException('The selected new availability template is no longer valid.');
        }

        let existingSlot = await transactionalSlotRepo.findOne({
          where: { doctorUserId: template.doctorUserId, date, session: template.session },
          lock: { mode: 'pessimistic_write' },
        });

        if (existingSlot) {
          newSlotToBook = existingSlot;
        } else {
          newSlotToBook = transactionalSlotRepo.create({
            doctorUserId: template.doctorUserId, date, session: template.session,
            start_time: template.start_time, end_time: template.end_time,
            max_tokens: template.max_tokens, tokens_issued: 0,
          });
        }
      } else {
        const foundSlot = await transactionalSlotRepo.findOne({
          where: { slot_id: newSlotId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!foundSlot) throw new NotFoundException('The selected new slot does not exist.');
        newSlotToBook = foundSlot;
      }
      // --- END OF IMPLEMENTED LOGIC ---

      if (oldSlotId && oldSlotId === newSlotToBook.slot_id) {
        throw new ConflictException('Cannot reschedule to the same slot.');
      }

      if (newSlotToBook.tokens_issued >= newSlotToBook.max_tokens) {
        throw new ConflictException('The new slot is already full.');
      }

      const oldSlot = await transactionalSlotRepo.findOne({
        where: { slot_id: oldSlotId },
        lock: { mode: 'pessimistic_write' },
      });

      if (oldSlot) {
        oldSlot.tokens_issued = Math.max(0, oldSlot.tokens_issued - 1);
        await transactionalSlotRepo.save(oldSlot);
      }

      newSlotToBook.tokens_issued += 1;
      const savedNewSlot = await transactionalSlotRepo.save(newSlotToBook);

      appointment.slot_id = savedNewSlot.slot_id;
      appointment.token_number = savedNewSlot.tokens_issued;

      return transactionalAppointmentRepo.save(appointment);
    });
  }

  async cancelAppointment(appointmentId: string, authUser) {
    return this.dataSource.transaction(async (manager) => {
      const transactionalAppointmentRepo = manager.getRepository(Appointment);
      const transactionalSlotRepo = manager.getRepository(Slot);

      const appointment = await transactionalAppointmentRepo.findOneBy({
        appointment_id: appointmentId,
      });

      if (!appointment) throw new NotFoundException('Appointment not found.');
      if (appointment.patientUserId !== authUser.sub && appointment.doctorUserId !== authUser.sub) throw new ForbiddenException('You are not authorized to cancel this appointment.');
      if (appointment.status === AppointmentStatus.CANCELED) return { message: 'Appointment was already canceled.' };

      if (appointment.slot_id) {
        const slot = await transactionalSlotRepo.findOne({
          where: { slot_id: appointment.slot_id },
          lock: { mode: 'pessimistic_write' },
        });

        if (slot) {
          slot.tokens_issued = Math.max(0, slot.tokens_issued - 1);
          await transactionalSlotRepo.save(slot);
        }
      }

      appointment.status = AppointmentStatus.CANCELED;
      await transactionalAppointmentRepo.save(appointment);

      return { message: 'Appointment successfully canceled.' };
    });
  }
}