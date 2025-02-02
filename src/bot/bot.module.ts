import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { DatabaseModule } from 'src/database/database.module';
import { HandlerService } from './handler.service';
import { StateService } from './state.service';

@Module({
  imports: [DatabaseModule],
  providers: [TelegramBotService, HandlerService, StateService],
})
export class BotModule {}
