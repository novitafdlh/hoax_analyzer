const jwt = require("jsonwebtoken");

const SECRET_KEY = "super_secret_key";

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (!err) {
      req.user = user;
    }

    next();
  });
};

module.exports = optionalAuthenticateToken;
