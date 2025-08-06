import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Slot } from './slot.entity';
import { Chat } from './chat.entity'; // <-- Make sure this is imported
import { RescheduleHistory } from './reschedule-history.entity'; // <-- And this one

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED', // "Consulted"
  CANCELED = 'CANCELED',   // "Unable to meet" or "Cancel"
  // You might add a "WAITING" status if needed, but SCHEDULED can cover this.
  RESCHEDULED = 'RESCHEDULED',

}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  appointment_id: string;
  
  // ... (doctorUserId, patientUserId, slot_id, token_number, complaint are all correct) ...
  @Column({ name: 'doctor_user_id' })
  doctorUserId: string;

  @Column({ name: 'patient_user_id' })
  patientUserId: string;
  
  @Column()
  slot_id: string;
  
  @Column()
  token_number: number;
  
  @Column({ type: 'text' })
  complaint: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  // --- ADD THESE RELATIONSHIPS BACK ---
  @OneToMany(() => Chat, (chat) => chat.appointment)
  chats: Chat[];

  @OneToMany(() => RescheduleHistory, (history) => history.appointment)
  reschedule_logs: RescheduleHistory[];
  // --- END OF ADDITIONS ---

  // ... (ManyToOne relationships for doctor, patient, slot are correct) ...
  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_user_id', referencedColumnName: 'user_id' })
  doctor: Doctor;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_user_id', referencedColumnName: 'user_id' })
  patient: Patient;
  
  @ManyToOne(() => Slot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'slot_id' })
  slot: Slot;

  @CreateDateColumn()
  created_at: Date;
  
  @UpdateDateColumn()
  updated_at: Date;
}