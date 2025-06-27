import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

type BitrixResponse = {
  error?: string;
  error_description?: string;
  [key: string]: any;
};

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  private bitrixWebhook = process.env.BITRIX_WEBHOOK_URL!;

  constructor() {}

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
