exports.RESPONSES = {
  noFindRes: "Sorry, I could not find anything for your question",
  sendToHumanRes: "Would you like me to send this question to a Human?",
  userSatisfied: "Is this the answer you were looking for?",
};

exports.send_human_quick_replies = [
  {
    title: "Yes",
    payload: `Yes, send it to a Human`,
    code: 1, //Send to MS Teams
  },
  {
    title: "No",
    payload: "No, don't send it to a Human",
    code: 2, //Do Nothing
  },
];

exports.find_else_quick_replies = [
  {
    title: "Yes",
    payload: "Yes, Thanks!",
    code: 3, //Do Nothing / reply with "Happy to help"
  },
  {
    title: "No",
    payload: `No, find something else`,
    code: 4, //Show all categories
  },
];

exports.quick_reply_categoryes_code = 5;
