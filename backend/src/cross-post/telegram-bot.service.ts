import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TelegramBotService.name);
    private polling = false;
    private offset = 0;

    constructor(private readonly config: ConfigService) { }

    onModuleInit() {
        const botToken =
            this.config.get<string>('TELEGRAM_WEBZINE_BOT_TOKEN') ||
            this.config.get<string>('TELEGRAM_BOT_TOKEN');

        if (botToken) {
            this.polling = true;
            this.startPolling();
        } else {
            this.logger.warn('No Telegram Bot Token found. Auto-responder listener disabled.');
        }
    }

    onModuleDestroy() {
        this.polling = false;
    }

    private async startPolling() {
        const botToken =
            this.config.get<string>('TELEGRAM_WEBZINE_BOT_TOKEN') ||
            this.config.get<string>('TELEGRAM_BOT_TOKEN');

        this.logger.log('Starting Telegram Bot auto-response polling listener...');

        // Wait a brief moment to ensure NestJS bootstrap completes
        await new Promise((r) => setTimeout(r, 2000));

        while (this.polling) {
            try {
                const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${this.offset}&timeout=30`;
                const res = await fetch(url);
                if (!res.ok) {
                    await new Promise((r) => setTimeout(r, 10000));
                    continue;
                }

                const data = await res.json();
                if (data.ok && data.result.length > 0) {
                    for (const update of data.result) {
                        this.offset = update.update_id + 1;
                        await this.handleUpdate(update);
                    }
                }
            } catch (err) {
                this.logger.error(`Error during Telegram bot polling: ${err}`);
                await new Promise((r) => setTimeout(r, 10000));
            }
        }
    }

    private async handleUpdate(update: any) {
        const message = update.message;
        if (!message || !message.text) return;

        const text = message.text.toLowerCase();
        const chatId = message.chat.id;

        // Trigger keyword check for site-related queries
        const keywords = [
            'zentaro',
            '젠타로',
            '사이트',
            '홈피',
            '웹진',
            '주소',
            'webzine',
            '어디',
            'where',
            'trang web',
            'địa chỉ',
            'link',
            'mua sắm',
            'cửa hàng',
            'ở đâu',
            'website',
            'mua rượu',
            'sản phẩm',
        ];
        const matchesKeyword = keywords.some((k) => text.includes(k));

        if (matchesKeyword) {
            this.logger.log(`Responding to message in chat ${chatId}: "${message.text}"`);

            const responseText =
                `Xin chào! Chúng tôi là <b>ZENTARO</b> - Thương hiệu nhà máy chưng cất thủ công cao cấp. 🥃\n\n` +
                `Bạn có thể truy cập trang web chính thức và các dịch vụ của chúng tôi qua các liên kết dưới đây:\n\n` +
                `👉 <a href="https://zentaro.netlify.app/">Trang chủ chính thức ZENTARO</a>\n` +
                `👉 <a href="https://zentaro.netlify.app/rewards/barrel-reserve">Chương trình sở hữu thùng gỗ sồi Barrel Reserve</a>\n` +
                `👉 <a href="https://zentaro.netlify.app/rewards/bottle-cap">Tham gia phần thưởng nắp chai Bottle Cap</a>\n` +
                `👉 <a href="https://zentaro.netlify.app/exchange">Giao dịch & Staking ZTRO Exchange</a>\n` +
                `👉 <a href="https://zentaro.netlify.app/mall">Cửa hàng trực tuyến ZENTARO Mall</a>\n\n` +
                `Nếu bạn có bất kỳ câu hỏi nào khác, xin vui lòng nhắn tin tại đây!`;

            await this.sendMessage(chatId, responseText, message.message_id);
        }
    }

    private async sendMessage(chatId: number, text: string, replyToMessageId?: number) {
        const botToken =
            this.config.get<string>('TELEGRAM_WEBZINE_BOT_TOKEN') ||
            this.config.get<string>('TELEGRAM_BOT_TOKEN');

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    parse_mode: 'HTML',
                    reply_to_message_id: replyToMessageId,
                }),
            });
            if (!res.ok) {
                const errBody = await res.json();
                this.logger.error(`Failed to send Telegram message response: ${JSON.stringify(errBody)}`);
            }
        } catch (err) {
            this.logger.error(`Error sending Telegram reply: ${err}`);
        }
    }
}
