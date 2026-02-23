const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const authenticateToken = require("./middleware/AuthMiddleware");
const authorizeRole = require("./middleware/roleMiddleware");
const officialNewsRoutes = require("./routes/officialNewsRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

const app = express();
app.use(bodyParser.json());

app.use("/api", authRoutes);

app.use("/api", officialNewsRoutes);

app.use("/api", submissionRoutes);

app.use(express.static("public"));

app.use("/uploads", express.static("uploads"));

app.get(
  "/admin-only",
  authenticateToken,
  authorizeRole("admin"),
  (req, res) => {
    res.json({ message: "Selamat datang admin" });
  }
);

app.listen(3000, () => {
  console.log("Server berjalan di port 3000");
});
