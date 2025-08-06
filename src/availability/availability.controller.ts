import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AvailabilityService } from './availability.service';
import { CreateSlotDto } from './dto/create-slot.dto';

@Controller('doctors/:doctorUserId/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  getSlotsForDoctor(
    @Param('doctorUserId', ParseUUIDPipe) doctorUserId: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException(
        'A `date` query parameter (YYYY-MM-DD) is required.',
      );
    }
    return this.availabilityService.getSlotsForDoctor(doctorUserId, date);
  }

  @Get('recurring')
  @UseGuards(AuthGuard('jwt')) // Optional: if you want to protect it
  getRecurringSlots(
    @Param('doctorUserId', ParseUUIDPipe) doctorUserId: string,
  ) {
    return this.availabilityService.getRecurringSlotsForDoctor(doctorUserId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  addAvailability(
    @Param('doctorUserId', ParseUUIDPipe) doctorUserId: string,
    @GetUser() authUser,
    @Body() createSlotDto: CreateSlotDto,
  ) {
    return this.availabilityService.addAvailability(
      doctorUserId,
      authUser.sub,
      createSlotDto,
    );
  }

  @Delete(':slotId')
  @UseGuards(AuthGuard('jwt'))
  deleteSlot(
    @Param('slotId') slotId: string,
    @GetUser() authUser,
  ) {
    return this.availabilityService.deleteSlot(slotId, authUser.sub);
  }
}
