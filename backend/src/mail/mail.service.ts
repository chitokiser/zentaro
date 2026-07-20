import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface OrderNotificationItem {
  productName: string;
  quantity: number;
  priceAp: number;
  fulfillmentType: string;
}

export interface OrderNotificationPayload {
  orderId: string;
  buyerEmail: string | null;
  items: OrderNotificationItem[];
  totalApPaid: number;
  totalExpPaid: number;
  shippingAddress: {
    recipientName: string;
    phone: string;
    postalCode: string;
    addressLine1: string;
    addressLine2?: string;
    deliveryMemo?: string;
  };
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('GMAIL_ACCOUNT');
    const pass = this.config.get<string>('GMAIL_APP_PASSWORD');
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'GMAIL_ACCOUNT/GMAIL_APP_PASSWORD not configured — order notification emails are disabled.',
      );
    }
  }

  async sendOrderNotification(payload: OrderNotificationPayload) {
    if (!this.transporter) return;
    const to = this.config.get<string>('ADMIN_NOTIFY_EMAIL');
    if (!to) return;

    const itemsHtml = payload.items
      .map(
        (i) =>
          `<li>${i.productName} x${i.quantity} (${i.fulfillmentType}) — ${i.priceAp.toLocaleString()} AP</li>`,
      )
      .join('');
    const addr = payload.shippingAddress;

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('GMAIL_ACCOUNT'),
        to,
        subject: `ZENTARO 신규 주문 (${payload.orderId})`,
        html: `
          <h3>신규 주문이 접수되었습니다</h3>
          <p>주문번호: ${payload.orderId}</p>
          <p>구매자: ${payload.buyerEmail ?? '알 수 없음'}</p>
          <ul>${itemsHtml}</ul>
          <p>결제: AP ${payload.totalApPaid.toLocaleString()} + EXP ${payload.totalExpPaid.toLocaleString()}</p>
          <p>배송지: ${addr.recipientName} / ${addr.phone} / (${addr.postalCode}) ${addr.addressLine1} ${addr.addressLine2 ?? ''}</p>
          ${addr.deliveryMemo ? `<p>배송 메모: ${addr.deliveryMemo}</p>` : ''}
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send order notification email', err as Error);
    }
  }
}
