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
      "Добро пожаловать. Выберите раздел 'Инструкция по использованию бота' в меню, чтобы узнать подробности.",
      {
        reply_markup: {
          keyboard: [
            [
              { text: "Богослужения" },
              { text: "Молитвы" },
              { text: "Информация" },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  }

  if (text === "Информация") {
    bot.telegram.sendMessage(chatId, {
      text: "Axiolist - это чат-бот, предназначенный для текстового и визуального сопровождения богослужений и содержащий текстовый и аудио-молитвослов. Проект подготовлен для того, чтобы участие в церковных таинствах для православных прихожан было более удобным и осознанным",
      parse_mode: "Markdown",
    });
  }

  // Добавляем айдишники пользователей для рассылки
  if (text === "Богослужения") {
    await axios
      .get("http://95.163.234.208:9000/api/list/getlist")
      .then(async (res) => {
        let inlineKeyboard = [];
        res.data.map((data) => {
          inlineKeyboard.push([{ text: data.name, callback_data: data._id }]);
        });
        await bot.telegram.sendMessage(
          chatId,
          "Выберите храм, в котором проходит богослужение, из списка ниже",
          {
            reply_markup: JSON.stringify({
              inline_keyboard: inlineKeyboard,
            }),
          }
        );
        inlineKeyboard.length = 0;
      });
  }

  // if (text === "/prayer") {
  //   const prayer = [
  //     [{ text: "Молитва перед работой", callback_data: "1" }],
  //     [{ text: "Молитва перед едой", callback_data: "2" }],
  //     [{ text: "Молитва перед ...", callback_data: "3" }],
  //   ];
  //   await bot.telegram.sendMessage(chatId, "Выберите молитву из списка", {
  //     reply_markup: JSON.stringify({
  //       inline_keyboard: prayer,
  //     }),
  //   });
  // }
  if (text === "Молитвы") {
    const prayer = [
      [{ text: "Молитва Господня. Отче наш", callback_data: "1" }],
      [{ text: "Молитвы в продолжение дня", callback_data: "2" }],
      [{ text: "Молитвы для святого причащения", callback_data: "3" }],
      [{ text: "Символ веры", callback_data: "4" }],
    ];
    await bot.telegram.sendMessage(chatId, "Выберите молитву, из списка ниже", {
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
  }
  if (data === "2") {
    const prayer = [
      [{ text: "Молитвы утренние", callback_data: "21" }],
      [{ text: "Молитва перед вкушением пищи", callback_data: "22" }],
      [{ text: "Молитва перед началом всякого дела", callback_data: "23" }],
      [
        {
          text: "Благодарение за всякое благодеяние Божие",
          callback_data: "4",
        },
      ],
      [{ text: "Молитвы на сон грядущим", callback_data: "24" }],
    ];
    await bot.telegram.sendMessage(
      chatId,
      "Выберите молитву, из раздела 'Молитвы в продолжение дня'",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: prayer,
        }),
      }
    );
  }
  if (data === "3") {
    const prayer = [
      [{ text: "Последование ко Святому Причащению", callback_data: "31" }],
      [
        {
          text: "Благодарственные молитвы по Святом Причащении",
          callback_data: "32",
        },
      ],
    ];
    await bot.telegram.sendMessage(
      chatId,
      "Выберите молитву, из раздела 'Молитвы для святого причащения'",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: prayer,
        }),
      }
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
