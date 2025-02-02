import { Chat } from 'node-telegram-bot-api';

export interface TelegramMessage {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name: string;
    };
    chat: Chat;
    date: number;
    text: string;
  };
}
