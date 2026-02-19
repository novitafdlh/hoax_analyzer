const db = require("../db");

const createSubmission = (
  imagePath,
  imageHash,
  extractedText,
  similarityScore,
  similarityLabel,
  systemStatus,
  userId,
  callback
) => {
  db.query(
    "INSERT INTO submissions (image_path, image_hash, extracted_text, similarity_score, similarity_label, system_status, final_status, submitted_by) VALUES (?, ?, ?, ?, ?, ?, 'menunggu_validasi', ?)",
    [imagePath, imageHash, extractedText, similarityScore, similarityLabel, systemStatus, userId],
    callback
  );
};

const getAllSubmissions = (callback) => {
  db.query("SELECT * FROM submissions ORDER BY created_at DESC", callback);
};

const getSubmissionsByStatus = (status, callback) => {
  db.query(
    "SELECT * FROM submissions WHERE final_status = ? ORDER BY created_at DESC",
    [status],
    callback
  );
};

const getSubmissionById = (id, callback) => {
  db.query(
    "SELECT * FROM submissions WHERE id = ?",
    [id],
    callback
  );
};

const getSubmissionStats = (callback) => {
  db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(final_status = 'menunggu_validasi') as menunggu,
      SUM(final_status = 'terverifikasi') as valid,
      SUM(final_status = 'ditolak') as ditolak
     FROM submissions`,
    callback
  );
};

module.exports = {
  createSubmission,
  getAllSubmissions,
  getSubmissionsByStatus,
  getSubmissionById,
  getSubmissionStats
};
