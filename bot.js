const { Telegraf } = require('telegraf');

// Token бота в Father Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Переменные для хранения данных пользователей
const userData = {};

// Тестовые данные заявок
const testData = [
  {
    id: 1,
    fio: 'Меркин А.Д.',
    group: 'MTH-101',
    faculty: 'ИИМРТ',
    school: null,
    reason: 'Прошу разрешить пересдать экзамен по математике.',
    time: '15:38',
    date: '15.05',
    source: 'bot',
    phone: null,
    status: 'new',
    username: 'merkad'
  },
  {
    id: 2,
    fio: null,
    group: null,
    school: 'Школа №15',
    faculty: null,
    reason: 'Необходимо получить справку об обучении для предоставления в военкомат.',
    time: '10:20',
    date: '01.05',
    source: 'call',
    phone: '123-456-7890',
    status: 'in-progress',
    username: 'ivanov'
  },
  // Add more test data as needed
];

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
    waitingForOperator: 'Your application has been successfully sent. We connect the operator...',
    noApplications: 'You have no applications.',
    applications: 'Your applications:',
    close: 'Close',
    closed: 'Application closed successfully.'
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
    waitingForOperator: 'Ваша заявка успешно отправлена. Подключаем оператора...',
    noApplications: 'У вас нет заявок.',
    applications: 'Ваши заявки:',
    close: 'Закрыть',
    closed: 'Заявка успешно закрыта.'
  }
};

// Регулярное выражение для проверки ФИО
const nameRegex = /^[А-Яа-яЁёA-Za-z]+ [А-Яа-яЁёA-Za-z]+( [А-Яа-яЁёA-Za-z]+)?$/;

// Стартовое сообщение
bot.start((ctx) => {
  userData[ctx.from.id] = { lang: 'ru' }; // Установка языка по умолчанию
  ctx.reply(`${texts.ru.chooseLanguage}`, {
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
bot.on('text', (ctx) => {
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
      user.step = 'menu';
      sendMenu(ctx, lang);
      break;
    case 'menu':
      if (message === 'Новая заявка') {
        user.step = user.type === 'student' ? 'enterGroup' : 'enterSchool';
        ctx.reply(user.type === 'student' ? texts[lang].enterGroup : texts[lang].enterSchool);
      } else if (message === 'Мои заявки') {
        showApplications(ctx, user);
      }
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
      user.step = 'menu';

      // Добавление тестовой заявки
      const newId = testData.length + 1;
      testData.push({
        id: newId,
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
      ctx.reply(texts[lang].success);

      // После успешной отправки заявки показать меню
      sendMenu(ctx, lang);
      break;
    default:
      ctx.reply(texts[lang].restart);
      break;
  }
});

// Функция для отправки меню
function sendMenu(ctx, lang) {
  ctx.reply('Выберите действие:', {
    reply_markup: {
      keyboard: [
        [{ text: 'Новая заявка' }, { text: 'Мои заявки' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
}

// Обработка нажатия кнопки "Мои заявки"
bot.hears('Мои заявки', (ctx) => {
  const user = userData[ctx.from.id];
  if (!user) {
    return ctx.reply('Пожалуйста, сначала выберите ваш язык, отправив команду /start.');
  }

  showApplications(ctx, user);
});

// Функция для отображения заявок пользователя
function showApplications(ctx, user) {
  const lang = user.lang;

  // Отображение тестовых данных
  const userApplications = testData.filter(app => app.username === ctx.message.from.username);
  if (userApplications.length === 0) {
    return ctx.reply(texts[lang].noApplications);
  }

  let response = `${texts[lang].applications}\n`;
  userApplications.forEach(app => {
    response += `\nЗаявка №${app.id}:\n` +
      `ФИО: ${app.fio || 'Не указано'}\n` +
      `Группа: ${app.group || 'Не указано'}\n` +
      `Школа: ${app.school || 'Не указано'}\n` +
      `Причина: ${app.reason}\n` +
      `Статус: ${app.status}\n` +
      `Дата: ${app.date}\n` +
      `Время: ${app.time}\n`;
  });

  ctx.reply(response, {
    reply_markup: {
      inline_keyboard: userApplications.map(app => [{
        text: texts[lang].close,
        callback_data: `close_${app.id}`
      }])
    }
  });
}

// Обработка команды для закрытия заявки
bot.action(/close_(\d+)/, (ctx) => {
  const id = ctx.match[1];
  const user = userData[ctx.from.id];

  // Найти заявку по ID
  const application = testData.find(app => app.id == id && app.username === ctx.message.from.username);

  if (!application) {
    return ctx.reply('Заявка не найдена.');
  }

  // Обновить статус заявки на 'closed'
  application.status = 'closed';

  ctx.reply(`Заявка №${id} успешно закрыта.`);
});

// Запуск бота
bot.launch();

console.log('Бот запущен');
