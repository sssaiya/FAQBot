if (typeof require !== "undefined") XLSX = require("xlsx");
var natural = require("natural"); // NLP lib
var Tokenizer = new natural.WordTokenizer();
natural.PorterStemmer.attach(); //Patch lib with stemming

var corpus = [];
module.exports.getData = function getDataObject() {
  var workbook = XLSX.readFile("data.xlsx");
  var first_sheet_name = workbook.SheetNames[0];

  /* Get worksheet */
  var worksheet = workbook.Sheets[first_sheet_name];
  let jsonData = XLSX.utils.sheet_to_json(worksheet);

  let data = {
    Questions: [],
    Answers: [],
    QuestionStems: [],
    AnswerStems: [],
    corpus: [],
  };

  for (const [key, value] of Object.entries(jsonData)) {
    data.Questions.push(value.Questions);
    data.Answers.push(value.Answers);
    let tokenizedQuestions = value.Questions.tokenizeAndStem();
    let tokenizedAnswers = value.Answers.tokenizeAndStem();
    data.QuestionStems.push(tokenizedQuestions);
    data.AnswerStems.push(tokenizedAnswers);

    //Add all tokens to our corpus, so that we can spellcheck user input and recommend against it
    tokenizedQuestions.forEach((token) => {
      corpus.push(token);
    });
    tokenizedAnswers.forEach((token) => {
      corpus.push(token);
    });

    data.corpus = corpus;
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
