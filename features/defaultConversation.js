/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const Data = require("../dataExtractor");
let data = Data.getData();

module.exports = function (controller) {
  controller.on("message,direct_message", async (bot, message) => {
    await bot.reply(message, { type: "typing" });
    Data.setCurrentQuestion(message.text);

    //Tokenize input and run spellcheck on all the words
    let spellChecked = Data.spellCheckPhrase(message.text, data.Corpus);
    console.log(spellChecked);
    let bestMatchIndex = Data.matchTokens(data.keyWordStems, spellChecked);

    if (bestMatchIndex == -1) {
      //Here as no answer found
      setTimeout(async () => {
        // will have to reset context because turn has now ended.
        await bot.changeContext(message.reference);

        await bot.reply(
          message,
          `Sorry, I could not find anything for your question`
        );

        await bot.reply(message, {
          text: "Would you like me to send this question to a Human?",
          quick_replies: [
            {
              title: "Yes",
              payload: `Yes, send it to a Human`,
            },
            {
              title: "No",
              payload: "No, don't send it to a Human",
            },
          ],
        });
      }, Data.BOT_TYPING_TIME);
    } else
      setTimeout(async () => {
        // will have to reset context because turn has now ended.
        await bot.changeContext(message.reference);

        await bot.reply(
          message,
          `${Data.BOT_NAME}: ${data.Answers[bestMatchIndex]}`
        );

        await bot.reply(message, {
          text: "Is this the answer you were looking for?",
          quick_replies: [
            {
              title: "Yes",
              payload: "Yes, Thanks!",
            },
            {
              title: "No",
              payload: `No, find something else`,
            },
          ],
        });
      }, Data.BOT_TYPING_TIME);
  });
};
