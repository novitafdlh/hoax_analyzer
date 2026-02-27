const generateImageHash = require("../utils/imageHash");
const extractText = require("../utils/ocr");
const cosineSimilarity = require("../utils/textSimilarity");
const officialNewsModel = require("../models/officialNewsModel");
const submissionModel = require("../models/submissionModel");
const guestUsageModel = require("../models/guestUsageModel");
const db = require("../db");

const GUEST_DAILY_LIMIT = 3;

const getTodayKey = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

const getClientIdentifier = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
};

const getGuestQuotaInfo = (req) => ({
  dateKey: getTodayKey(),
  clientIdentifier: getClientIdentifier(req)
});

const formatGuestQuota = (used) => ({
  daily_limit: GUEST_DAILY_LIMIT,
  used,
  remaining: Math.max(0, GUEST_DAILY_LIMIT - used)
});

const readGuestQuotaStatus = async (guestContext) => {
  const used = await guestUsageModel.findUsageByDateAndClient(
    guestContext.dateKey,
    guestContext.clientIdentifier
  );

  return formatGuestQuota(used);
};

const bumpGuestQuotaStatus = async (guestContext) => {
  const used = await guestUsageModel.incrementUsage(
    guestContext.dateKey,
    guestContext.clientIdentifier
  );

  return formatGuestQuota(used);
};

const submitImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File gambar wajib diunggah" });
    }

    const filePath = req.file.path;
    const userId = req.user ? req.user.id : null;
    const guestContext = userId ? null : getGuestQuotaInfo(req);

    if (guestContext) {
      const quota = await readGuestQuotaStatus(guestContext);

      if (quota.remaining <= 0) {
        return res.status(429).json({
          message: "Batas verifikasi guest 3x/hari telah tercapai. Silakan login untuk verifikasi tanpa batas.",
          guest_limit: quota
        });
      }
    }

    const imageHash = generateImageHash(filePath);

    officialNewsModel.findByHash(imageHash, async (hashErr, hashResults) => {
      if (hashErr) {
        return res.status(500).json({ message: "Gagal memeriksa hash gambar" });
      }

      if (hashResults.length > 0) {
        return submissionModel.createSubmission(
          filePath,
          imageHash,
          hashResults[0].extracted_text,
          1.0,
          "tinggi",
          "terverifikasi",
          userId,
          async (saveErr) => {
            if (saveErr) {
              return res.status(500).json({ message: "Gagal menyimpan hasil submission" });
            }

            try {
              const guestLimit = guestContext
                ? await bumpGuestQuotaStatus(guestContext)
                : null;

              return res.json({
                system_status: "terverifikasi",
                similarity_score: 1.0,
                similarity_label: "tinggi",
                final_status: "menunggu_validasi",
                guest_limit: guestLimit
              });
            } catch (quotaErr) {
              return res.status(500).json({ message: "Gagal memperbarui kuota guest" });
            }
          }
        );
      }

      try {
        const extractedText = await extractText(filePath);

        officialNewsModel.getAllOfficialTexts((textErr, officialTexts) => {
          if (textErr) {
            return res.status(500).json({ message: "Gagal mengambil data pembanding resmi" });
          }

          let highestSimilarity = 0;

          officialTexts.forEach((item) => {
            const score = cosineSimilarity(extractedText, item.extracted_text);

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

          const safeScore = Number(highestSimilarity.toFixed(4));

          submissionModel.createSubmission(
            filePath,
            imageHash,
            extractedText,
            safeScore,
            similarityLabel,
            systemStatus,
            userId,
            async (saveErr) => {
              if (saveErr) {
                return res.status(500).json({ message: "Gagal menyimpan hasil submission" });
              }

              try {
                const guestLimit = guestContext
                  ? await bumpGuestQuotaStatus(guestContext)
                  : null;

                return res.json({
                  system_status: systemStatus,
                  similarity_score: safeScore,
                  similarity_label: similarityLabel,
                  final_status: "menunggu_validasi",
                  guest_limit: guestLimit
                });
              } catch (quotaErr) {
                return res.status(500).json({ message: "Gagal memperbarui kuota guest" });
              }
            }
          );
        });
      } catch (ocrErr) {
        return res.status(500).json({ message: "Gagal mengekstrak teks dari gambar" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error proses submission" });
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

      return res.json({ message: "Berhasil divalidasi" });
    }
  );
};

const getAllSubmissions = (req, res) => {
  db.query(
    "SELECT * FROM submissions ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ message: "Gagal ambil data" });

      return res.json(results);
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

      return res.json(results);
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

      return res.json(results[0]);
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

      return res.json(results[0]);
    }
  );
};

const getMySubmissions = (req, res) => {
  submissionModel.getSubmissionsByUserId(req.user.id, (err, results) => {
    if (err) return res.status(500).json({ message: "Gagal ambil riwayat submission" });

    return res.json(results);
  });
};

const getGuestQuota = async (req, res) => {
  try {
    if (req.user) {
      return res.json({
        is_logged_in: true,
        guest_limit: null,
        message: "Login aktif: verifikasi tanpa batas"
      });
    }

    const quota = await readGuestQuotaStatus(getGuestQuotaInfo(req));

    return res.json({
      is_logged_in: false,
      guest_limit: quota
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil status kuota guest" });
  }
};

module.exports = {
  submitImage,
  validateSubmission,
  getAllSubmissions,
  getSubmissionsByStatus,
  getStats,
  getSubmissionDetail,
  getMySubmissions,
  getGuestQuota
};
