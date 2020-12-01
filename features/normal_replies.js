/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const Data = require("../dataExtractor");
let data = Data.getData();

//Set up categories menu
let categories_quick_replies = [];
let topics_quick_replies = {};
for (const key of Object.keys(data.Categories)) {
  let category = capitalizeFirstLetter(key);
  categories_quick_replies.push({
    title: category,
    payload: category,
  });

  // Get indexes for all the keywords linked to this Category
  let topicsIndexes = data.Categories[key];

  topics_quick_replies[key] = [];
  topicsIndexes.forEach((index) => {
    topics_quick_replies[key].push({
      title: data.KeyWords[index],
      payload: data.KeyWords[index],
    });
  });
}

console.log(topics_quick_replies);

//Set up topics menu for each category

module.exports = function (controller) {
  // Simple replies
  controller.hears(
    async (message) =>
      message.text && message.text.toLowerCase() === "yes, thanks!",
    ["message"],
    async (bot, message) => {
      await bot.reply(
        message,
        "Happy to help. Let me know if there is anything else I can help you with"
      );
    }
  );

  // When answer is not satisfactory, show them all the categories of topics
  controller.hears(
    async (message) =>
      message.text &&
      message.text.toLowerCase().includes("no, find something else"),
    ["message"],
    async (bot, message) => {
      await bot.reply(message, {
        text: "Here are all the categories of topics I have information on",
        quick_replies: categories_quick_replies,
      });
    }
  );

  //For each category that user types, show them all the topics related
  controller.hears(
    async (message) =>
      message.text && data.Categories[message.text.toLowerCase()],
    ["message"],
    async (bot, message) => {
      console.log(topics_quick_replies[message.text.toLowerCase()]);
      await bot.reply(message, {
        text: `Here are all the topics I have information on for ${message.text}`,
        quick_replies: topics_quick_replies[message.text.toLowerCase()],
      });
    }
  );

  controller.hears(
    async (message) =>
      message.text &&
      message.text.toLowerCase().includes("yes, send it to a human"),
    ["message"],
    async (bot, message) => {
      await bot.reply(message, "Sending your question to a HR representative");
    }
  );

  controller.hears(
    async (message) =>
      message.text &&
      message.text.toLowerCase().includes("no, don't send it to a human"),
    ["message"],
    async (bot, message) => {
      await bot.reply(
        message,
        "Okay, For any further concern please connect with Agency Payroll Co-ordinator." +
          "\n\nLet me know if I can help you with anything else"
      );
    }
  );
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
