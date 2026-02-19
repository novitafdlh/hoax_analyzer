const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const authenticateToken = require("../middleware/AuthMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");
const officialNewsController = require("../controllers/officialNewsController");

router.post(
  "/upload-official",
  authenticateToken,
  authorizeRole("admin"),
  upload.single("image"),
  officialNewsController.uploadOfficialNews
);

module.exports = router;
