import TelegramBot from "node-telegram-bot-api";
import schedule from "node-schedule";
import moment from "moment";
import fs from "fs";

// Вставьте сюда ваш токен от BotFather
const token = "7199624492:AAGWwHjG_CxBPNksCm2AGvrW_-60YQVTZUs";

// Создание экземпляра бота
const bot = new TelegramBot(token, { polling: true });

const TIMERS_FILE = "timers.json";

interface Timer {
  endDate: string;
  message: string;
}

interface Timers {
  [chatId: string]: Timer[];
}

// Функция для отправки напоминания
const sendReminder = (chatId: string, message: string) => {
  bot.sendMessage(chatId, message);
};

// Загрузка таймеров из файла
const loadTimers = (): Timers => {
  if (fs.existsSync(TIMERS_FILE)) {
    const data = fs.readFileSync(TIMERS_FILE, "utf8");
    return JSON.parse(data);
  }
  return {};
};

// Сохранение таймеров в файл
const saveTimers = (timers: Timers) => {
  fs.writeFileSync(TIMERS_FILE, JSON.stringify(timers, null, 2));
};

// Загрузка таймеров при запуске
const timers = loadTimers();

// Восстановление запланированных задач
for (const chatId in timers) {
  timers[chatId].forEach(({ endDate, message }) => {
    const job = schedule.scheduleJob(new Date(endDate), () => {
      sendReminder(chatId, message);
    });
    // Сохранение задачи обратно в таймер
    timers[chatId] = timers[chatId].map((timer) =>
      timer.endDate === endDate && timer.message === message
        ? { ...timer, job }
        : timer
    );
  });
}

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Привет! Я бот-напоминалка. Используйте команду /settimer для установки таймера."
  );
});

// Обработка команды /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Команды:\n/settimer [начальная дата] [срок (в месяцах)] - Установить таймер"
  );
});

// Обработка команды /settimer
bot.onText(/\/settimer (.+)/, (msg, match) => {
  const chatId = msg.chat.id.toString();

  if (!match) {
    bot.sendMessage(
      chatId,
      "Неверный формат. Используйте: /settimer [начальная дата в формате YYYY-MM-DD] [срок в месяцах]"
    );
    return;
  }
  const [startDate, duration] = match[1].split(" ");

  if (
    !moment(startDate, "YYYY-MM-DD", true).isValid() ||
    isNaN(parseInt(duration))
  ) {
    bot.sendMessage(
      chatId,
      "Неверный формат. Используйте: /settimer [начальная дата в формате YYYY-MM-DD] [срок в месяцах]"
    );
    return;
  }

  //const endDate = moment(startDate).add(parseInt(duration), "months").toDate();
  // const testDateNowPlus10Seconds = moment().add(10, "seconds").toDate();

  const endDate = moment().add(10, "seconds").toDate();

  const message = `Напоминание: Пора планировать поездку в Дубай для продления визы! (Начальная дата: ${startDate}, Срок: ${duration} месяцев)`;

  const job = schedule.scheduleJob(endDate, () => {
    sendReminder(chatId, message);
  });

  // Сохранение таймера
  timers[chatId] = timers[chatId] || [];
  timers[chatId].push({ endDate: endDate.toISOString(), message });

  saveTimers(timers);

  bot.sendMessage(
    chatId,
    `Таймер установлен. Вы получите напоминание ${moment(endDate).format("YYYY-MM-DD")}.`
  );
});

console.log("Бот запущен и готов к работе...");

// Пример использования:
// /settimer 2021-08-01 1
// /settimer 2021-08-01 3
// 22 мая 2023 года
// 2023-05-22
