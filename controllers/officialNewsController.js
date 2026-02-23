const generateImageHash = require("../utils/imageHash");
const extractText = require("../utils/ocr");
const officialNewsModel = require("../models/officialNewsModel");

const uploadOfficialNews = async (req, res) => {
  try {
    const title = req.body.title;
    const filePath = req.file.path;
    const normalizedPath = filePath.replace(/\\/g, "/");

    const imageHash = generateImageHash(filePath);
    const extractedText = await extractText(filePath);

    officialNewsModel.createOfficialNews(
      title,
      normalizedPath,
      imageHash,
      extractedText,
      (err) => {
        if (err) return res.status(500).json({ message: "Gagal simpan data" });

        res.json({
          message: "Berita resmi berhasil disimpan",
          hash: imageHash
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error processing image" });
  }
};

const getAllOfficial = (req, res) => {
  officialNewsModel.getAllOfficialNews((err, results) => {
    if (err) return res.status(500).json({ message: "Gagal ambil data" });

    res.json(results);
  });
};

module.exports = {
  uploadOfficialNews,
  getAllOfficial
};
