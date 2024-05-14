const { Telegraf } = require('telegraf');
const axios = require('axios');

// Token бота из переменных окружения
const bot = new Telegraf(process.env.BOT_TOKEN);

// URL вашего API для отправки заявок из переменных окружения
const API_URL = `${process.env.API_URL}`;

// Переменные для хранения данных пользователей
const userData = {};

// Тексты на разных языках
const texts = {
  en: {
    chooseLanguage: 'Please select your language:',
    mainMenu: 'Please choose an option:',
    requestStatus: 'View Request Status',
    newRequest: 'Submit a New Request',
    cancelRequest: 'Cancel Request',
    backToMenu: 'Back to Menu',
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
    invalidName: 'Invalid name format. Please enter your full name (First name Last name and optionally Middle name).'
  },
  ru: {
    chooseLanguage: 'Пожалуйста, выберите ваш язык:',
    mainMenu: 'Пожалуйста, выберите опцию:',
    requestStatus: 'Просмотр статуса заявки',
    newRequest: 'Отправить новую заявку',
    cancelRequest: 'Отменить заявку',
    backToMenu: 'Назад в меню',
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
    invalidName: 'Неверный формат имени. Пожалуйста, введите ваше полное имя (Фамилия Имя Отчество при наличии).'
  }
};

// Регулярное выражение для проверки ФИО
const nameRegex = /^[А-Яа-яЁёA-Za-z]+ [А-Яа-яЁёA-Za-z]+( [А-Яа-яЁёA-Za-z]+)?$/;

// Стартовое сообщение
bot.start((ctx) => {
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
  userData[ctx.from.id] = { lang: 'en', step: 'mainMenu' };
  ctx.reply(texts.en.mainMenu, {
    reply_markup: {
      keyboard: [
        [{ text: texts.en.newRequest }],
        [{ text: texts.en.requestStatus }],
        [{ text: texts.en.cancelRequest }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.action('lang_ru', (ctx) => {
  userData[ctx.from.id] = { lang: 'ru', step: 'mainMenu' };
  ctx.reply(texts.ru.mainMenu, {
    reply_markup: {
      keyboard: [
        [{ text: texts.ru.newRequest }],
        [{ text: texts.ru.requestStatus }],
        [{ text: texts.ru.cancelRequest }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// Обработка нажатий кнопок меню
bot.hears([texts.en.newRequest, texts.ru.newRequest], (ctx) => {
  const user = userData[ctx.from.id];
  user.step = 'chooseStatus';
  ctx.reply(texts[user.lang].welcome, {
    reply_markup: {
      inline_keyboard: [
        [{ text: texts[user.lang].student, callback_data: 'student' }],
        [{ text: texts[user.lang].applicant, callback_data: 'applicant' }],
        [{ text: texts[user.lang].backToMenu, callback_data: 'backToMenu' }]
      ]
    }
  });
});

bot.hears([texts.en.requestStatus, texts.ru.requestStatus], (ctx) => {
  const user = userData[ctx.from.id];
  ctx.reply(`Your request status will be shown here. (This is a placeholder response)`, {
    reply_markup: {
      keyboard: [
        [{ text: texts[user.lang].backToMenu }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.hears([texts.en.cancelRequest, texts.ru.cancelRequest], (ctx) => {
  const user = userData[ctx.from.id];
  delete userData[ctx.from.id];
  ctx.reply(`Your request has been canceled. (This is a placeholder response)`);
  ctx.reply(texts[user.lang].mainMenu, {
    reply_markup: {
      keyboard: [
        [{ text: texts[user.lang].newRequest }],
        [{ text: texts[user.lang].requestStatus }],
        [{ text: texts[user.lang].cancelRequest }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.action('backToMenu', (ctx) => {
  const user = userData[ctx.from.id];
  user.step = 'mainMenu';
  ctx.reply(texts[user.lang].mainMenu, {
    reply_markup: {
      keyboard: [
        [{ text: texts[user.lang].newRequest }],
        [{ text: texts[user.lang].requestStatus }],
        [{ text: texts[user.lang].cancelRequest }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// Обработка выбора статуса
bot.action('student', (ctx) => {
  const user = userData[ctx.from.id];
  user.type = 'student';
  user.step = 'enterName';
  ctx.reply(texts[user.lang].enterName, {
    reply_markup: {
      inline_keyboard: [
        [{ text: texts[user.lang].backToMenu, callback_data: 'backToMenu' }]
      ]
    }
  });
});

bot.action('applicant', (ctx) => {
  const user = userData[ctx.from.id];
  user.type = 'applicant';
  user.step = 'enterName';
  ctx.reply(texts[user.lang].enterName, {
    reply_markup: {
      inline_keyboard: [
        [{ text: texts[user.lang].backToMenu, callback_data: 'backToMenu' }]
      ]
    }
  });
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
        return ctx.reply(texts[lang].invalidName, {
          reply_markup: {
            inline_keyboard: [
              [{ text: texts[lang].backToMenu, callback_data: 'backToMenu' }]
            ]
          }
        });
      }
      user.fio = message.trim();
      user.step = user.type === 'student' ? 'enterGroup' : 'enterSchool';
      ctx.reply(user.type === 'student' ? texts[lang].enterGroup : texts[lang].enterSchool, {
        reply_markup: {
          inline_keyboard: [
            [{ text: texts[lang].backToMenu, callback_data: 'backToMenu' }]
          ]
        }
      });
      break;
    case 'enterGroup':
      user.group = message.trim();
      user.step = 'enterReason';
      ctx.reply(texts[lang].enterReason, {
        reply_markup: {
          inline_keyboard: [
            [{ text: texts[lang].backToMenu, callback_data: 'backToMenu' }]
          ]
        }
      });
      break;
    case 'enterSchool':
      user.school = message.trim();
      user.step = 'enterReason';
      ctx.reply(texts[lang].enterReason, {
        reply_markup: {
          inline_keyboard: [
            [{ text: texts[lang].backToMenu, callback_data: 'backToMenu' }]
          ]
        }
      });
      break;
    case 'enterReason':
      user.reason = message.trim();
      user.step = 'done';

      // Отправка данных на сервер
      try {
        await axios.post(API_URL, {
          fio: user.fio,
          group: user.group,
          school: user.school,
          reason: user.reason,
          source: 'telegram',
          chatId: ctx.chat.id,
          username: ctx.message.from.username,
          userType: user.type
        });

        ctx.reply(texts[lang].success, {
          reply_markup: {
            inline_keyboard: [
              [{ text: texts[lang].backToMenu, callback_data: 'backToMenu' }]
            ]
          }
        });
      } catch (error) {
        console.error('Ошибка при отправке заявки:', error);
        ctx.reply(texts[lang].error, {
          reply_markup: {
            inline_keyboard: [
              [{ text: texts[lang].backToMenu, callback_data: 'backToMenu' }]
            ]
          }
        });
      }

      // Очистка данных пользователя после отправки заявки
      delete userData[ctx.from.id];
      break;
    default:
      ctx.reply(texts[lang].restart, {
        reply_markup: {
          inline_keyboard: [
            [{ text: texts[lang].backToMenu, callback_data: 'backToMenu' }]
          ]
        }
      });
      break;
  }
});

// Запуск бота
bot.launch();

console.log('Бот запущен');
