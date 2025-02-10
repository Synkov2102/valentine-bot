import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { ValentineService } from 'src/database/valentine.service';
import { StateService } from './state.service';
import { ImageService } from 'src/database/image.service';

@Injectable()
export class HandlerService {
  constructor(
    private stateService: StateService,
    private valentineService: ValentineService,
    private imageService: ImageService,
  ) {}

  /**
   * Начинает процесс создания валентинки, отправляя пользователю доступные изображения.
   * @param {TelegramBot} bot - Экземпляр Telegram-бота.
   * @param {number} chatId - ID чата с пользователем.
   */
  async startValentineForm(bot: TelegramBot, chatId: number) {
    // Получаем список доступных изображений
    const images = await this.imageService.findAll();

    if (!images || !images.length) {
      await bot.sendMessage(
        chatId,
        'Нет доступных изображений для валентинок.',
      );
      return;
    }

    // Устанавливаем состояние пользователя
    this.stateService.setState(chatId, 'awaiting_image_selection');

    // Отправляем каждую картинку с кнопкой
    for (const image of images) {
      await this.sendImageWithCaption(
        bot,
        chatId,
        image.url,
        image.description,
        [
          {
            text: 'Выбрать это изображение',
            callback_data: `select_image_${image._id}`,
          },
        ],
      );
    }

    // Сообщение с инструкцией после показа всех картинок
    await bot.sendMessage(
      chatId,
      'Выберите изображение для валентинки, нажимая на соответствующую кнопку под картинкой. Или если вы передумали, нажмите на кнопку под этим сообщением.',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Не хочу создавать валентинку',
                callback_data: `cancel_form`,
              },
            ],
          ],
        },
      },
    );
  }

  /**
   * Обрабатывает текстовые сообщения пользователя в зависимости от текущего состояния.
   * @param {TelegramBot} bot - Экземпляр Telegram-бота.
   * @param {number} chatId - ID чата с пользователем.
   * @param {string} text - Текст сообщения пользователя.
   */
  async handleValentineForm(bot: TelegramBot, chatId: number, text: string) {
    const userState = this.stateService.getState(chatId);

    if (!userState) {
      await bot.sendMessage(chatId, 'Пожалуйста, начните с команды /start.');
      return;
    }

    const stateHandlersMap = {
      awaiting_text: async () => {
        if (!text || typeof text !== 'string') {
          await bot.sendMessage(
            chatId,
            'Пожалуйста, введите корректный текст.',
          );
          return;
        }

        this.stateService.updateData(chatId, { message: text });
        this.stateService.setState(chatId, 'awaiting_recipient');
        await bot.sendMessage(chatId, 'Введите ник получателя валентинки:');
      },
      awaiting_recipient: async () => {
        if (!text || typeof text !== 'string') {
          await bot.sendMessage(chatId, 'Пожалуйста, введите корректный ник.');
          return;
        }

        const recipient = text.replace(/@/g, '').toLowerCase();
        this.stateService.updateData(chatId, { recipient });

        const { imageId, message } = this.stateService.getState(chatId).data;

        try {
          const image = await this.imageService.findById(imageId);

          await this.valentineService.create({
            imageUrl: image.url,
            text: message,
            to: recipient,
            from: 'me', // Здесь можно подставить фактическое имя отправителя
            createdAt: new Date(),
            viewed: false,
          });

          await bot.sendMessage(
            chatId,
            `Валентинка успешно создана!\nКому: @${recipient}\nТекст: "${message}"\nИзображение: ${image.url}`,
          );
          await this.showStandartActions(bot, chatId);
        } catch (error) {
          console.error('Ошибка при создании валентинки:', error);
          await bot.sendMessage(
            chatId,
            'Произошла ошибка при создании валентинки. Попробуйте снова.',
          );
        } finally {
          this.stateService.clearState(chatId);
        }
      },
    };

    const handler = stateHandlersMap[userState.state];
    if (handler) {
      await handler();
    } else {
      await bot.sendMessage(
        chatId,
        'Произошла ошибка. Начните с команды /start.',
      );
      this.stateService.clearState(chatId);
    }
  }

  /**
   * Отправляет валентинки для указанного пользователя.
   * @param {TelegramBot} bot - Экземпляр Telegram-бота.
   * @param {number} chatId - ID чата с пользователем.
   * @param {string} username - Имя пользователя, для которого нужно показать валентинки.
   * @param {'all' | 'new'} type - Тип валентинок: 'all' (все) или 'new' (непросмотренные).
   */
  async showValentinesForUser(
    bot: TelegramBot,
    chatId: number,
    username: string,
    type: 'all' | 'new',
  ) {
    try {
      let valentines;

      if (type === 'new') {
        valentines = await this.valentineService.findUnviewedValentinesForUser(
          username.toLowerCase(),
        );
      } else {
        valentines = await this.valentineService.findValentinesForUser(
          username.toLowerCase(),
        );
      }

      if (!valentines || valentines.length === 0) {
        await bot.sendMessage(
          chatId,
          `У вас нет ${type === 'new' ? 'новых' : ''} валентинок.`,
        );
        await this.showStandartActions(bot, chatId);
        return;
      }

      for (const valentine of valentines) {
        await this.sendImageWithCaption(
          bot,
          chatId,
          valentine.imageUrl,
          valentine.text,
        );
      }

      await this.showStandartActions(bot, chatId);
    } catch (error) {
      console.error('Ошибка при получении валентинок:', error);
      await bot.sendMessage(
        chatId,
        'Произошла ошибка при получении ваших валентинок. Попробуйте позже.',
      );
    }
  }

  /**
   * Показывает стандартные действия (кнопки) пользователю.
   * @param {TelegramBot} bot - Экземпляр Telegram-бота.
   * @param {number} chatId - ID чата с пользователем.
   */
  async showStandartActions(bot: TelegramBot, chatId: number) {
    try {
      const keyboard = {
        inline_keyboard: [
          [
            { text: 'Посмотреть почту', callback_data: 'view_mailbox' },
            { text: 'Отправить валентинку', callback_data: 'send_valentine' },
          ],
        ],
      };
      await bot.sendMessage(chatId, 'Выберите действие:', {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error('Ошибка при отправке списка действий:', error);
      await bot.sendMessage(
        chatId,
        'Произошла ошибка при отправке списка действий.',
      );
    }
  }

  /**
   * Показывает выбор типа почты (все или новые) пользователю.
   * @param {TelegramBot} bot - Экземпляр Telegram-бота.
   * @param {number} chatId - ID чата с пользователем.
   * @param {string} username - Имя пользователя.
   */
  async showMailTypes(bot: TelegramBot, chatId: number, username: string) {
    try {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '📩 Посмотреть все',
              callback_data: `view-all_${username}`,
            },
          ],
          [
            {
              text: '🆕 Посмотреть новые',
              callback_data: `view-new_${username}`,
            },
          ],
        ],
      };

      await bot.sendMessage(chatId, 'Выберите действие:', {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error('Ошибка при отправке списка действий:', error);
      await bot.sendMessage(
        chatId,
        'Произошла ошибка при отправке списка действий.',
      );
    }
  }

  /**
   * Отправляет изображение с подписью и кнопкой (если указана).
   * @param {TelegramBot} bot - Экземпляр Telegram-бота.
   * @param {number} chatId - ID чата с пользователем.
   * @param {string} imageUrl - URL изображения.
   * @param {string} caption - Подпись к изображению.
   * @param {Array} inlineKeyboard - Кнопки под изображением (опционально).
   */
  private async sendImageWithCaption(
    bot: TelegramBot,
    chatId: number,
    imageUrl: string,
    caption: string,
    inlineKeyboard?: { text: string; callback_data: string }[],
  ) {
    try {
      await bot.sendPhoto(chatId, imageUrl, {
        caption,
        reply_markup: inlineKeyboard
          ? { inline_keyboard: [inlineKeyboard] }
          : undefined,
      });
    } catch (error) {
      console.error('Ошибка при отправке изображения:', error);
      await bot.sendMessage(chatId, 'Ошибка при отправке изображения.');
    }
  }
}
