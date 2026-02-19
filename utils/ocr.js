const Tesseract = require("tesseract.js");

async function extractText(filePath) {
  const result = await Tesseract.recognize(filePath, "eng");
  return result.data.text;
}

module.exports = extractText;
