const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
var compression = require("compression");
var helmet = require("helmet");
var XLSX = require("xlsx");
var natural = require("natural"); // NLP lib
var Tokenizer = new natural.WordTokenizer();
var wordnet = new natural.WordNet();
natural.PorterStemmer.attach(); //Patch lib with stemming
const { IncomingWebhook } = require("ms-teams-webhook");
var cors = require("cors");

var app = express();
app.use(cors());
app.use(bodyParser({ limit: "50mb" }));
app.use(bodyParser.json());
app.use(compression());
app.use(helmet()); // Protects ugainst vulnerabilities by sending appropriate headers
app.use(express.static(__dirname + "/public"));

var data = null;
getData();
app.get("/userMessage", (req, res) => {
  let question = req.query.Question;
  userQuestion(question);
  res.send("RESPONSE");
  // res.sendFile(path.join(__dirname + "/public/html/index.html"));
});

app.get("/addNewProject", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/html/addNewProjectForm.html"));
});

let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server is running on " + port);
  console.log("Version 0.1");
});

var currentQuestion = "";
const BOT_NAME = "";
const BOT_TYPING_TIME = "2000";

function getData() {
  if (data != null) {
    return data;
  }
  var workbook = XLSX.readFile("data.xlsx");
  // console.log(workbook);
  var first_sheet_name = workbook.SheetNames[0];
  console.log("HERE in data Extract");

  /* Get worksheet */
  var worksheet = workbook.Sheets[first_sheet_name];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  data = {
    Categories: {},
    KeyWords: [],
    Answers: [],
    keyWordStems: [],
    AnswerStems: [],
    Corpus: [],
  };

  //Set of all categories
  let categoriesSet = new Set();
  let categories = {};
  var corpus = [];

  for (let i = 0; i < jsonData.length; i++) {
    addCategories(i);
    const keyword = jsonData[i]["Keyword "];
    const answer = jsonData[i]["Answer "];
    let tokenizedQuestions = keyword.tokenizeAndStem();
    let tokenizedAnswers = answer.tokenizeAndStem();
    data.KeyWords.push(keyword);
    data.Answers.push(answer);
    data.keyWordStems.push(tokenizedQuestions);
    data.AnswerStems.push(tokenizedAnswers);

    //Add all tokens to our corpus, so that we can spellcheck user input and recommend against it
    tokenizedQuestions.forEach((token) => {
      corpus.push(token);
    });
    tokenizedAnswers.forEach((token) => {
      corpus.push(token);
    });
  }

  data.Corpus = corpus;
  data.Categories = categories;

  function addCategories(key) {
    let cat = jsonData[key]["Category "];
    if (!cat) cat = "uncategorized";
    cat = cat.trim().toLowerCase();

    if (categoriesSet.has(cat)) {
      categories[cat].push(key);
    } else {
      categoriesSet.add(cat);
      categories[cat] = [key];
    }
  }
}

function userQuestion(text) {
  //Tokenize input and run spellcheck on all the words
  let spellChecked = spellCheckPhrase(text, data.Corpus);
  console.log(spellChecked);
  let bestMatchIndex = matchTokens(data.keyWordStems, spellChecked);
  console.log(bestMatchIndex);
}

function getSynonyms(keyword) {
  var synonymsArr = [];
  wordnet.lookup(keyword, async function (results) {
    results.forEach(function (result) {
      result.synonyms.forEach(function (syn) {
        if (synonymsArr.indexOf(syn) === -1) {
          synonymsArr.push(syn);
        }
      });
    });
  });
  return synonymsArr;
}

//Tokenization
function tokenizerArray(inputs) {
  let ret = [];
  inputs.forEach((input) => {
    ret.concat(input.tokenizeAndStem());
  });
  return ret;
}

// module.exports.tokenizeandstem = function (input) {
//   return input.tokenizeAndStem();
// };

//Helper function to spellcheck a word and return possible words with correct spelling from given corpus
function spellCheck(wordToCheck, corpus) {
  let spellChecked = [];
  var spellcheck = new natural.Spellcheck(corpus);
  let checked = spellcheck.getCorrections(wordToCheck, 1);
  for (const [key, value] of Object.entries(checked)) {
    spellChecked.push(value);
  }
  return spellChecked;
}

//SpellChecks a sentence and returns root words. Used to process a question
function spellCheckPhrase(text, corpus) {
  let tokens = text.tokenizeAndStem();
  let spellChecked = [];
  tokens.forEach((token) => {
    let spellCheckedWords = spellCheck(token, corpus);
    spellChecked = spellChecked.concat(spellCheckedWords);
  });
  return spellChecked;
}

// Given an array of arrays of tokens,
// and an array to match
// Find the index of the array that matches most tokens from toMatch
function matchTokens(questionTokens, toMatchTokens) {
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
}

function findAllMatches(questionTokens, toMatchTokens) {
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
}

const url =
  "https://outlook.office.com/webhook/8857addc-0e4a-4d8a-a8d5-c3412175d200@d52c9ea1-7c21-47b1-82a3-33a74b1f74b8/IncomingWebhook/b86f3e9fe6724ee79f5f5097b4b32903/a76343d9-43aa-4900-a179-8e0a3baa763e";

// Initialize
const webhook = new IncomingWebhook(url);
function sendCurrentQuestionToChat(senderName) {
  var dateTime = new Date();
  // var d = new Date(year, month, day);
  let question = currentQuestion;
  console.log(`\n\n\nSending Question to chat - \n${currentQuestion}`);

  webhook.send(
    JSON.stringify({
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: "Someone asked a question I cannot answer",
      themeColor: "0078D7",
      title: "Help the bot answer this question",
      sections: [
        {
          activityTitle: `${senderName}`,
          activitySubtitle: `${dateTime}`,
          text: `${question}`,
        },
      ],
    })
  );
}
