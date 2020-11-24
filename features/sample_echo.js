/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const Data = require("../dataExtractor");
let data = Data.getData();

module.exports = function (controller) {
  controller.hears("sample", "message,direct_message", async (bot, message) => {
    await bot.reply(message, "I heard a sample message.");
  });

  controller.on("message,direct_message", async (bot, message) => {
    //Tokenize input and run spellcheck on all the words
    let spellChecked = Data.spellCheckPhrase(message.text, data.corpus);
    console.log(spellChecked);
    let bestMatchIndex = Data.matchTokens(data.QuestionStems, spellChecked);
    await bot.reply(message, `FAQBot: ${data.Answers[bestMatchIndex]}`);
  });
};
