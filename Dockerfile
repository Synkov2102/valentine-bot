# Используем минимальный образ Node.js 18
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая devDependencies)
RUN npm install

# Копируем весь код проекта
COPY . .

# Компилируем TypeScript-код в JavaScript
RUN npm run build

# Отображаем содержимое `dist/` для отладки
RUN ls -la dist

# Запускаем приложение
CMD ["node", "dist/main.js"]
