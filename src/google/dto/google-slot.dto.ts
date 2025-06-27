import { IsString, Matches } from 'class-validator';

export class GoogleSlotDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string; // формат YYYY-MM-DD

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  time: string; // формат HH:MM

  @IsString()
  @Matches(/^\d+$/)
  maxBookings: string; // приходит как строка, парсится в Number
}