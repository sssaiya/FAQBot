if (typeof require !== "undefined") XLSX = require("xlsx");

module.exports.getData = function getDataObject() {
  var workbook = XLSX.readFile("data.xlsx");
  var first_sheet_name = workbook.SheetNames[0];

  /* Get worksheet */
  var worksheet = workbook.Sheets[first_sheet_name];
  let jsonData = XLSX.utils.sheet_to_json(worksheet);

  let data = { Questions: [], Answers: [] };

  for (const [key, value] of Object.entries(jsonData)) {
    data.Questions.push(value.Questions);
    data.Answers.push(value.Answers);
  }
  return data;
}