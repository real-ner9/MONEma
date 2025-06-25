import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';

type BitrixResponse = {
  error?: string;
  error_description?: string;
  [key: string]: any;
};

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  private sheetClient: any;
  private sheetId = process.env.GOOGLE_SHEET_ID!;
  private bitrixWebhook = process.env.BITRIX_WEBHOOK_URL!;

  constructor() {
    const jwtClient = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheetClient = google.sheets({ version: 'v4', auth: jwtClient });
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
        range: 'A1',
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

  async sendBookingToBitrix(data: {
    name: string;
    phone: string;
    comment: string;
  }) {
    try {
      const payload = {
        fields: {
          TITLE: 'Заявка с бота Monema',
          NAME: data.name || 'Без имени',
          PHONE: [{ VALUE: data.phone, VALUE_TYPE: 'WORK' }],
          COMMENTS: data.comment || '',
        },
      };

      const res = await fetch(this.bitrixWebhook, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json() as BitrixResponse;
      if (json.error) {
        throw new Error(json.error_description || json.error);
      }

      this.logger.log(`📥 Bitrix24: заявка успешно отправлена`);
    } catch (e) {
      this.logger.error(`❌ Bitrix ошибка: ${e.message}`);
      throw e;
    }
  }
}
