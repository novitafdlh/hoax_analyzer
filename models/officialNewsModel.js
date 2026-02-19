const db = require("../db");

const createOfficialNews = (title, imagePath, imageHash, extractedText, callback) => {
  db.query(
    "INSERT INTO official_news (title, image_path, image_hash, extracted_text) VALUES (?, ?, ?, ?)",
    [title, imagePath, imageHash, extractedText],
    callback
  );
};

const findByHash = (imageHash, callback) => {
  db.query(
    "SELECT * FROM official_news WHERE image_hash = ?",
    [imageHash],
    callback
  );
};

const getAllOfficialTexts = (callback) => {
  db.query(
    "SELECT extracted_text FROM official_news",
    callback
  );
};

module.exports = {
  createOfficialNews,
  findByHash,
  getAllOfficialTexts
};
