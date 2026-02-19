const generateImageHash = require("../utils/imageHash");
const extractText = require("../utils/ocr");
const cosineSimilarity = require("../utils/textSimilarity");
const officialNewsModel = require("../models/officialNewsModel");
const submissionModel = require("../models/submissionModel");
const db = require("../db");

const submitImage = async (req, res) => {
  try {
    const filePath = req.file.path;
    const userId = req.user.id;

    const imageHash = generateImageHash(filePath);

    // STEP 1: cek hash
    officialNewsModel.findByHash(imageHash, async (err, results) => {
      if (results.length > 0) {
        // Hash cocok
        submissionModel.createSubmission(
          filePath,
          imageHash,
          results[0].extracted_text,
          1.0,
          "terverifikasi",
          userId,
          () => {
            res.json({ status: "terverifikasi", similarity: 1.0 });
          }
        );
      } else {
        // Hash tidak cocok → lanjut OCR
        const extractedText = await extractText(filePath);

        officialNewsModel.getAllOfficialTexts((err, officialTexts) => {
          let highestSimilarity = 0;

          officialTexts.forEach((item) => {
            const score = cosineSimilarity(
              extractedText,
              item.extracted_text
            );

            if (score > highestSimilarity) {
              highestSimilarity = score;
            }
          });

          let systemStatus = "tidak_ditemukan";
          let similarityLabel = "rendah";
          if (highestSimilarity > 0.7) {
            systemStatus = "terverifikasi";
            similarityLabel = "tinggi";
          } else if (highestSimilarity > 0.4) {
            systemStatus = "perlu_verifikasi";
            similarityLabel = "sedang";
          }

          submissionModel.createSubmission(
            filePath,
                imageHash,
                extractedText,
                highestSimilarity,
                similarityLabel,
                systemStatus,
                userId,
                callback,
            () => {
              res.json({
                system_status: systemStatus,
                similarity_score: highestSimilarity,
                similarity_label: similarityLabel,
                final_status: "menunggu_validasi"
              });
            }
          );
        });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error proses submission" });
  }
};

const validateSubmission = (req, res) => {
  const id = req.params.id;
  const { final_status } = req.body;

  db.query(
    "UPDATE submissions SET final_status = ? WHERE id = ?",
    [final_status, id],
    (err) => {
      if (err) return res.status(500).json({ message: "Gagal update" });

      res.json({ message: "Berhasil divalidasi" });
    }
  );
};

const getAllSubmissions = (req, res) => {
  db.query(
    "SELECT * FROM submissions ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ message: "Gagal ambil data" });

      res.json(results);
    }
  );
};

const getSubmissionsByStatus = (req, res) => {
  const status = req.params.status;

  db.query(
    "SELECT * FROM submissions WHERE final_status = ? ORDER BY created_at DESC",
    [status],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Gagal ambil data" });

      res.json(results);
    }
  );
};

const getSubmissionDetail = (req, res) => {
  const id = req.params.id;

  db.query(
    "SELECT * FROM submissions WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Gagal ambil data" });

      if (results.length === 0) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      res.json(results[0]);
    }
  );
};

const getStats = (req, res) => {
  db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(final_status = 'menunggu_validasi') as menunggu,
      SUM(final_status = 'terverifikasi') as valid,
      SUM(final_status = 'ditolak') as ditolak
     FROM submissions`,
    (err, results) => {
      if (err) return res.status(500).json({ message: "Gagal ambil statistik" });

      res.json(results[0]);
    }
  );
};

module.exports = {
  submitImage,
  validateSubmission,
  getAllSubmissions,
  getSubmissionsByStatus,
  getStats,
  getSubmissionDetail
};
