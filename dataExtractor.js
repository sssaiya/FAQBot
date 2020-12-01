if (typeof require !== "undefined") XLSX = require("xlsx");
var natural = require("natural"); // NLP lib
var Tokenizer = new natural.WordTokenizer();
natural.PorterStemmer.attach(); //Patch lib with stemming

var currentQuestion = "";

module.exports.BOT_NAME = "HR Ops";
module.exports.BOT_TYPING_TIME = "2000";
var data = null;

var corpus = [];
module.exports.getData = function getDataObject() {
  if (data != null) {
    return data;
  }
  var workbook = XLSX.readFile("data2.xlsx");
  var first_sheet_name = workbook.SheetNames[1];

  /* Get worksheet */
  var worksheet = workbook.Sheets[first_sheet_name];
  let jsonData = XLSX.utils.sheet_to_json(worksheet);

  data = {
    Categories: [],
    KeyWords: [],
    Answers: [],
    keyWordStems: [],
    AnswerStems: [],
    Corpus: [],
  };

  //Sum up all categories
  let categoriesSet = new Set();
  let categories = {};
  // categoriesSet.forEach((category) => {
  //   categories[category] = [];
  // });

  for (const [key, value] of Object.entries(jsonData)) {
    let thisCategory = value.Category.trim().toLowerCase();
    if (categoriesSet.has(thisCategory)) {
      categories[thisCategory].push(key);
    } else {
      categoriesSet.add(thisCategory);
      categories[thisCategory] = [key];
    }

    data.KeyWords.push(value.Keyword);
    data.Answers.push(value.Answer);
    let tokenizedQuestions = value.Keyword.tokenizeAndStem();
    let tokenizedAnswers = value.Answer.tokenizeAndStem();
    data.keyWordStems.push(tokenizedQuestions);
    data.AnswerStems.push(tokenizedAnswers);

    //Add all tokens to our corpus, so that we can spellcheck user input and recommend against it
    tokenizedQuestions.forEach((token) => {
      corpus.push(token);
    });
    tokenizedAnswers.forEach((token) => {
      corpus.push(token);
    });

    data.Corpus = corpus;
    data.Categories = categories;
  }
  return data;
};

//Tokenization
function tokenizerArray(inputs) {
  let ret = [];
  inputs.forEach((input) => {
    ret.concat(input.tokenizeAndStem());
  });
  return ret;
}

module.exports.tokenizeandstem = function (input) {
  return input.tokenizeAndStem();
};

//Helper function to spellcheck a word and return possible words with correct spelling from given corpus
function spellCheck(corpus, wordToCheck) {
  let spellChecked = [];
  var spellcheck = new natural.Spellcheck(corpus);
  let checked = spellcheck.getCorrections(wordToCheck, 1);
  for (const [key, value] of Object.entries(checked)) {
    spellChecked.push(value);
  }
  return spellChecked;
}

//SpellChecks a sentence and returns root words. Used to process a question
module.exports.spellCheckPhrase = function spellCheckPhrase(text, corpus) {
  console.log(typeof text);
  console.log(Array.isArray(text));
  let tokens = text.tokenizeAndStem();
  let spellChecked = [];
  tokens.forEach((token) => {
    let spellCheckedWords = spellCheck(corpus, token);
    spellChecked = spellChecked.concat(spellCheckedWords);
  });
  return spellChecked;
};

// Given an array of arrays of tokens,
// and an array to match
// Find the index of the array that matches most tokens from toMatch
module.exports.matchTokens = function matchTokens(
  questionTokens,
  toMatchTokens
) {
  let matched = 0;
  let indexOfBestMatch = -1;
  for (let i = 0; i < questionTokens.length; i++) {
    let thisMatch = 0;
    questionTokens[i].forEach((token) => {
      if (toMatchTokens.includes(token)) {
        thisMatch++;
      }
    });
    if (matched < thisMatch) {
      matched = thisMatch;
      indexOfBestMatch = i;
    }
  }
  console.log("best match - " + indexOfBestMatch);
  return indexOfBestMatch;
};

module.exports.findAllMatches = function findAllMatches(
  questionTokens,
  toMatchTokens
) {
  let matched = [];
  for (let i = 0; i < questionTokens.length; i++) {
    let thisMatch = 0;
    questionTokens[i].forEach((token) => {
      if (toMatchTokens.includes(token)) {
        thisMatch++;
      }
    });
    if (thisMatch > 0) {
      matched.push(i);
    }
  }
  return matched;
};

module.exports.getCurrentQuestion = function () {
  return currentQuestion;
};
module.exports.setCurrentQuestion = function (newQuestion) {
  currentQuestion = newQuestion;
};
