const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const authenticateToken = require("../middleware/AuthMiddleware");
const optionalAuthenticateToken = require("../middleware/optionalAuthMiddleware");
const submissionController = require("../controllers/submissionController");
const authorizeRole = require("../middleware/roleMiddleware");

router.post(
  "/submit",
  optionalAuthenticateToken,
  upload.single("image"),
  submissionController.submitImage
);

router.get(
  "/my-submissions",
  authenticateToken,
  submissionController.getMySubmissions
);

router.get(
  "/guest-quota",
  optionalAuthenticateToken,
  submissionController.getGuestQuota
);

router.put(
  "/submission/validate/:id",
  authenticateToken,
  authorizeRole("admin"),
  submissionController.validateSubmission
);

router.get(
  "/submissions",
  authenticateToken,
  authorizeRole("admin"),
  submissionController.getAllSubmissions
);

router.get(
  "/submissions/status/:status",
  authenticateToken,
  authorizeRole("admin"),
  submissionController.getSubmissionsByStatus
);

router.get(
  "/submission/:id",
  authenticateToken,
  authorizeRole("admin"),
  submissionController.getSubmissionDetail
);

router.get(
  "/dashboard/stats",
  authenticateToken,
  authorizeRole("admin"),
  submissionController.getStats
);

module.exports = router;
