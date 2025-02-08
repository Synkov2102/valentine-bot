import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { HandlerService } from './handler.service';
import { StateService } from './state.service';

@Injectable()
export class TelegramBotService {
  private token = process.env.TELEGRAM_BOT_TOKEN; // Используем переменную окружения
  private bot: TelegramBot;

  constructor(
    private handlerService: HandlerService,
    private stateService: StateService,
  ) {
    this.bot = new TelegramBot(this.token, { polling: true });
    this.initializeHandlers();
  }

  /**
   * Инициализирует обработчики событий бота.
   */
  private initializeHandlers() {
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    this.bot.on('message', this.handleMessage.bind(this));
    this.bot.onText(/\/start/, this.handleStartCommand.bind(this));
  }

  /**
   * Обрабатывает команду /start.
   * @param {TelegramBot.Message} msg - Сообщение от пользователя.
   */
  private async handleStartCommand(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    if (!chatId) {
      console.error('Chat ID не найден.');
      return;
    }

    const welcomeMessage = `Привет!🌹 Я бот для обмена валентинками❤️\nC моей помощью ты можешь поблагодарить коллег и оставить им приятные послания💌\n\n✨ Вот что я умею:\n\n1️⃣ *Отправить валентинку* — необходимо выбрать валентинку, написать текст, указать ник пользователя в телеграм через @, кому хотите сделать отправление. Ваша валентинка будет полностью анонимной.\n\n2️⃣ *Проверить свой почтовый ящик* — посмотреть, какие валентинки вы получили.`;

    const imageUrl =
      'https://downloader.disk.yandex.ru/preview/36de2da6db6cd3a9e3f8475638098c3731bad28a2ffad5bb6c3cf0634f0e2b77/679fc00a/Fe4hwWUY6pHgl1UShRLuE4v0JQzvLLXM0mo6R7sNwXvaQy2gnSp3uPZMXwoGJalhD-SRdwLHJdZyej7EEAmbQg%3D%3D?uid=0&filename=Frame%202%20%281%29.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=0&tknv=v2&size=2048x2048';

    try {
      await this.bot.sendPhoto(chatId, imageUrl, {
        caption: welcomeMessage,
        parse_mode: 'Markdown',
      });
      await this.handlerService.showStandartActions(this.bot, chatId);
    } catch (error) {
      console.error('Ошибка при отправке изображения:', error);
    }
  }

  /**
   * Обрабатывает callback-запросы от inline-кнопок.
   * @param {TelegramBot.CallbackQuery} callbackQuery - Callback-запрос.
   */
  private async handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    const chatId = callbackQuery?.message?.chat.id;
    const data = callbackQuery.data;

    if (!chatId) {
      console.error('Chat ID не найден.');
      return;
    }

    const [action, username] = data.split('_');

    if (data === 'view_mailbox') {
      const username = callbackQuery.from.username;
      await this.handlerService.showMailTypes(this.bot, chatId, username);
    } else if (action === 'view-all') {
      await this.handlerService.showValentinesForUser(
        this.bot,
        chatId,
        username,
        'all',
      );
    } else if (action === 'view-new') {
      await this.handlerService.showValentinesForUser(
        this.bot,
        chatId,
        username,
        'new',
      );
    } else if (data.startsWith('select_image_')) {
      const imageId = data.replace('select_image_', '');
      this.stateService.updateData(chatId, { imageId });
      this.stateService.setState(chatId, 'awaiting_text');
      await this.bot.sendMessage(chatId, 'Введите текст для вашей валентинки:');
    } else if (data === 'cancel_form') {
      this.stateService.clearState(chatId);
      await this.handlerService.showStandartActions(this.bot, chatId);
    } else if (data === 'send_valentine') {
      await this.handlerService.startValentineForm(this.bot, chatId);
    }
  }

  /**
   * Обрабатывает текстовые сообщения от пользователя.
   * @param {TelegramBot.Message} msg - Сообщение от пользователя.
   */
  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!chatId) {
      console.error('Chat ID не найден.');
      return;
    }

    if (text === '/start') return;

    const userState = this.stateService.getState(chatId);

    if (userState && userState.state) {
      await this.handlerService.handleValentineForm(this.bot, chatId, text);
      return;
    }

    if (text === 'Посмотреть почту') {
      const username = msg.from.username;
      await this.handlerService.showMailTypes(this.bot, chatId, username);
    } else if (text === 'Отправить валентинку') {
      await this.handlerService.startValentineForm(this.bot, chatId);
    } else {
      await this.handlerService.showStandartActions(this.bot, chatId);
    }
  }
}
