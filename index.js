const { Telegraf } = require("telegraf");
const axios = require("axios");

const token = "6024993575:AAHQRolaMABZPqaKNMHOBDLf66vCj29imA4";

const bot = new Telegraf(token);

const uniqueIds = new Set();

bot.on("message", async (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.from.id;
  if (text === "/start") {
    bot.telegram.sendMessage(
      chatId,
      "Добро пожаловать. Выберите раздел 'Инструкция по использованию бота' в меню, чтобы узнать подробности."
    );
  }

  if (text === "/faq") {
    bot.telegram.sendMessage(chatId, {
      text: "*Инструкция к боту*.\n\nНажмите на кнопку *К службе* в левом нижнем меню, либо введите команду `/startlection`, чтобы выбрать службу\n\nДля выхода со службы используйте команду `/quit`, либо нажмите на кнопку *Покинуть службу* для того чтобы материалы со службы не приходили.",
      parse_mode: "Markdown",
    });
  }

  // Добавляем айдишники пользователей для рассылки
  if (text === "/startlection") {
    await axios
      .get("http://95.163.234.208:9000/api/list/getlist")
      .then(async (res) => {
        let inlineKeyboard = [];
        res.data.map((data) => {
          inlineKeyboard.push([{ text: data.name, callback_data: data._id }]);
        });
        await bot.telegram.sendMessage(chatId, "Выберите службу из списка", {
          reply_markup: JSON.stringify({
            inline_keyboard: inlineKeyboard,
          }),
        });
        inlineKeyboard.length = 0;
      });
  }

  if (text === "/prayer") {
    const prayer = [
      [{ text: "Молитва перед работой", callback_data: "1" }],
      [{ text: "Молитва перед едой", callback_data: "2" }],
      [{ text: "Молитва перед ...", callback_data: "3" }],
    ];
    await bot.telegram.sendMessage(chatId, "Выберите молитву из списка", {
      reply_markup: JSON.stringify({
        inline_keyboard: prayer,
      }),
    });
  }

  if (text === "/quit") {
    await axios
      .get("http://95.163.234.208:9000/api/list/getlist")
      .then((res) => {
        bot.telegram.sendMessage(chatId, "Вы покинули службу");
        res.data.forEach((data) => {
          if (data.usersId) {
            axios.patch(
              `http://95.163.234.208:9000/api/list/updatelistusers/${data._id}`,
              {
                usersId: data.usersId.filter((name) => name !== chatId),
                id: data._id,
              }
            );
          }
        });
      });
  }
});

bot.on("poll_answer", async (ctx) => {
  let array = [];
  axios
    .get("http://95.163.234.208:9000/api/lection/getmaterials")
    .then((res) => {
      {
        res.data.forEach((task) => {
          console.log(ctx.pollAnswer.poll_id);
          if (task.pollId?.includes(ctx.pollAnswer.poll_id)) {
            if (task.optionsReply.length !== 0) {
              task.optionsReply.push(ctx.pollAnswer.option_ids[0]);
              axios.patch(
                "http://95.163.234.208:9000/api/lection/updatematerial",
                {
                  ...task,
                  optionsReply: task.optionsReply,
                }
              );
            } else {
              axios.patch(
                "http://95.163.234.208:9000/api/lection/updatematerial",
                {
                  ...task,
                  optionsReply: [ctx.pollAnswer.option_ids[0]],
                }
              );
            }
          }
        });
      }
    });
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.update.callback_query.data;
  const chatId = ctx.from.id;
  let usersId = [];
  const uniqueIds = new Set();
  if (data === "1") {
    const prayer1 = ["Привет", "Пока", "Рука"];
    await prayer1.forEach((el, i) => {
      setTimeout(() => bot.telegram.sendMessage(chatId, el), 2000 * (i + 1));
    });
    await bot.telegram.sendAudio(
      chatId,
      "https://hitster.fm/public/adv.download.php?url=https://ts01.flac.pw/mp3/229626.mp3?Rema%20%E2%80%93%20Calm%20Down"
    );
  }
  if (data === "2") {
    const prayer1 = ["огогвф", "в323кму", "мувам"];
    await prayer1.forEach((el, i) => {
      setTimeout(() => bot.telegram.sendMessage(chatId, el), 2000 * (i + 1));
    });
    await bot.telegram.sendAudio(
      chatId,
      "https://hitster.fm/public/adv.download.php?url=https://ts01.flac.pw/mp3/229626.mp3?Rema%20%E2%80%93%20Calm%20Down"
    );
  }
  if (data === "3") {
    const prayer1 = ["3", "4", "5432"];
    await prayer1.forEach((el, i) => {
      setTimeout(() => bot.telegram.sendMessage(chatId, el), 2000 * (i + 1));
    });
    await bot.telegram.sendAudio(
      chatId,
      "https://hitster.fm/public/adv.download.php?url=https://ts01.flac.pw/mp3/229626.mp3?Rema%20%E2%80%93%20Calm%20Down"
    );
  }
  if (data.length > 6) {
    await axios
      .get(`http://95.163.234.208:9000/api/list/getlist/${data}`)
      .then(async (res) => {
        if (res.data.usersId.indexOf(chatId) === -1) {
          usersId.push(chatId);
          await bot.telegram.sendMessage(
            chatId,
            `Служба "${res.data.name}" выбрана`
          );
          await res.data.usersId.push(chatId);
          uniqueIds.add(usersId);
          await axios.patch(
            `http://95.163.234.208:9000/api/list/updatelistusers/${data}`,
            {
              usersId: res.data.usersId,
              id: data,
            }
          );
        } else {
          bot.telegram.sendMessage(
            chatId,
            `Вы уже находитесь в службе "${res.data.name}"`
          );
        }
      });
  }
});
bot.launch();
