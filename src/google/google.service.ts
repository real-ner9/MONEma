import { Injectable, Logger } from '@nestjs/common';
import { GoogleSlotDto } from './dto/google-slot.dto';
import { CrmService } from '../crm/crm.service';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(CrmService.name);
  private sheetClient: any;
  private sheetId = process.env.GOOGLE_SHEET_ID!;

  constructor() {
    const jwtClient = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheetClient = google.sheets({ version: 'v4', auth: jwtClient });
  }

  async fetchSlots(): Promise<GoogleSlotDto[]> {
    try {
      const { data } = await this.sheetClient.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: 'Slots!A2:C',
      });

      const rows = data.values;
      if (!rows || rows.length === 0) {
        this.logger.warn('📄 Google Sheets: нет данных');
        return [];
      }

      const dtos: GoogleSlotDto[] = [];
      for (const row of rows) {
        const [date, time] = row;

        const dto = plainToInstance(GoogleSlotDto, {
          date,
          time,
        });

        const errors = await validate(dto);
        if (errors.length > 0) {
          this.logger.warn(`⚠️ Пропущена строка с ошибками: ${JSON.stringify(row)}`);
          continue;
        }

        dtos.push(dto);
      }

      this.logger.log(`✅ Загружено слотов из Google Sheets: ${dtos.length}`);
      return dtos;
    } catch (error) {
      this.logger.error(`❌ Ошибка чтения из Google Sheets: ${error.message}`);
      throw error;
    }
  }

  async sendBookingToGoogleSheet(data: {
    telegramId: string;
    username: string;
    phone: string;
    slotDate: string;
    slotTime: string;
    slotId: string;
  }) {
    try {
      await this.sheetClient.spreadsheets.values.append({
        spreadsheetId: this.sheetId,
        range: 'Bookings',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            data.telegramId,
            data.username || '',
            data.phone || '',
            data.slotDate,
            data.slotTime,
            data.slotId,
            new Date().toISOString(),
          ]],
        },
      });

      this.logger.log(`📄 Google Sheets: запись добавлена`);
    } catch (e) {
      this.logger.error(`❌ Google Sheets ошибка: ${e.message}`);
      throw e;
    }
  }
}
