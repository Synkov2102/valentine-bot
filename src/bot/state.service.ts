import { Injectable } from '@nestjs/common';

@Injectable()
export class StateService {
  private userStates = new Map<number, any>(); // Храним состояния пользователей

  setState(chatId: number, state: string, data: any = {}) {
    const existingState = this.userStates.get(chatId) || { data: {} };

    this.userStates.set(chatId, {
      state,
      data: { ...existingState.data, ...data }, // Объединяем старые и новые данные
    });
  }

  getState(chatId: number): { state: string; data: any } | null {
    return this.userStates.get(chatId) || null;
  }

  updateData(chatId: number, newData: any) {
    const currentState = this.userStates.get(chatId);
    if (currentState) {
      this.userStates.set(chatId, {
        ...currentState,
        data: { ...currentState.data, ...newData }, // Обновляем только data
      });
    }
  }

  clearState(chatId: number) {
    this.userStates.delete(chatId);
  }
}
