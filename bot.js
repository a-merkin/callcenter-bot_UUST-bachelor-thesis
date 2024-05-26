const { Telegraf } = require('telegraf');
const axios = require('axios');
const io = require('socket.io-client');

// Token бота в Father Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// URL вашего API для отправки заявок
const API_URL = `${process.env.API_URL}/incidents`;

// URL WebSocket сервера
const SOCKET_URL = `${process.env.API_URL}/chat`;

// Переменные для хранения данных пользователей
const userData = {};

// Тексты на разных языках
const texts = {
  en: {
    chooseLanguage: 'Please select your language:',
    welcome: 'Welcome! Please select your status:',
    student: 'Student',
    applicant: 'Applicant',
    enterName: 'Please enter your full name:',
    enterGroup: 'Please enter your group:',
    enterSchool: 'Please enter your school:',
    enterReason: 'Please enter the reason for your request:',
    success: 'Your request has been successfully sent!',
    error: 'An error occurred while sending the request. Please try again later.',
    restart: 'Please first select your language by sending the /start command.',
    invalidName: 'Invalid name format. Please enter your full name (First name Last name and optionally Middle name).',
    waitingForOperator: 'Your application has been successfully sent. We connect the operator...'
  },
  ru: {
    chooseLanguage: 'Пожалуйста, выберите ваш язык:',
    welcome: 'Добро пожаловать! Пожалуйста, выберите ваш статус:',
    student: 'Студент',
    applicant: 'Абитуриент',
    enterName: 'Пожалуйста, введите ваше полное имя:',
    enterGroup: 'Пожалуйста, введите вашу группу:',
    enterSchool: 'Пожалуйста, введите вашу школу:',
    enterReason: 'Пожалуйста, введите причину вашего обращения:',
    success: 'Ваша заявка успешно отправлена!',
    error: 'Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.',
    restart: 'Пожалуйста, сначала выберите ваш язык, отправив команду /start.',
    invalidName: 'Неверный формат имени. Пожалуйста, введите ваше полное имя (Фамилия Имя Отчество при наличии).',
    waitingForOperator: 'Ваша заявка успешно отправлена. Подключаем оператора...'
  }
};

// Регулярное выражение для проверки ФИО
const nameRegex = /^[А-Яа-яЁёA-Za-z]+ [А-Яа-яЁёA-Za-z]+( [А-Яа-яЁёA-Za-z]+)?$/;

// Стартовое сообщение
bot.start((ctx) => {
  userData[ctx.from.id] = { lang: 'ru' }; // Установка языка по умолчанию
  ctx.reply(texts.ru.chooseLanguage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'English', callback_data: 'lang_en' }],
        [{ text: 'Русский', callback_data: 'lang_ru' }]
      ]
    }
  });
});

// Обработка выбора языка
bot.action('lang_en', (ctx) => {
  userData[ctx.from.id] = { ...userData[ctx.from.id], lang: 'en', step: 'chooseStatus' };
  ctx.reply(texts.en.welcome, {
    reply_markup: {
      inline_keyboard: [
        [{ text: texts.en.student, callback_data: 'student' }],
        [{ text: texts.en.applicant, callback_data: 'applicant' }]
      ]
    }
  });
});

bot.action('lang_ru', (ctx) => {
  userData[ctx.from.id] = { ...userData[ctx.from.id], lang: 'ru', step: 'chooseStatus' };
  ctx.reply(texts.ru.welcome, {
    reply_markup: {
      inline_keyboard: [
        [{ text: texts.ru.student, callback_data: 'student' }],
        [{ text: texts.ru.applicant, callback_data: 'applicant' }]
      ]
    }
  });
});

// Обработка выбора статуса
bot.action('student', (ctx) => {
  const user = userData[ctx.from.id];
  user.type = 'student';
  user.step = 'enterName';
  ctx.reply(texts[user.lang].enterName);
});

bot.action('applicant', (ctx) => {
  const user = userData[ctx.from.id];
  user.type = 'applicant';
  user.step = 'enterName';
  ctx.reply(texts[user.lang].enterName);
});

// Обработка текстовых сообщений по шагам
bot.on('text', async (ctx) => {
  const user = userData[ctx.from.id];

  if (!user) {
    return ctx.reply(texts.ru.restart);
  }

  const lang = user.lang;
  const step = user.step;
  const message = ctx.message.text;

  switch (step) {
    case 'enterName':
      if (!nameRegex.test(message.trim())) {
        return ctx.reply(texts[lang].invalidName);
      }
      user.fio = message.trim();
      user.step = user.type === 'student' ? 'enterGroup' : 'enterSchool';
      ctx.reply(user.type === 'student' ? texts[lang].enterGroup : texts[lang].enterSchool);
      break;
    case 'enterGroup':
      user.group = message.trim();
      user.step = 'enterReason';
      ctx.reply(texts[lang].enterReason);
      break;
    case 'enterSchool':
      user.school = message.trim();
      user.step = 'enterReason';
      ctx.reply(texts[lang].enterReason);
      break;
    case 'enterReason':
      user.reason = message.trim();
      user.step = 'done';

      // Отправка данных на сервер
      try {
        const response = await axios.post(API_URL, {
          fio: user.fio,
          group: user.group,
          school: user.school,
          reason: user.reason,
          source: 'telegram',
          chatId: ctx.chat.id,
          username: ctx.message.from.username,
          userType: user.type,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          status: 'new',
          phone: null
        });

        ctx.reply(texts[lang].waitingForOperator);

        const { id } = response.data;

        // Установка соединения с WebSocket сервером и создание чата
        const socket = io(SOCKET_URL);

        socket.emit('joinChat', id);
        
        socket.on('receiveMessage', (message) => {
          ctx.reply(`${message}`);
        });

        userData[ctx.from.id].socket = socket;

        ctx.reply(texts[lang].success);
      } catch (error) {
        console.error('Ошибка при отправке заявки:', error);
        ctx.reply(texts[lang].error);
      }

      break;
    default:
      ctx.reply(texts[lang].restart);
      break;
  }
});

// Запуск бота
bot.launch();

console.log('Бот запущен');
