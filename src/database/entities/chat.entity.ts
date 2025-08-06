import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from './user.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  chat_id: string;

  @Column()
  appointment_id: string;

  @Column()
  sender_id: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.chats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}

