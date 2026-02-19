const db = require("../db");

const findUserByUsername = (username, callback) => {
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    callback
  );
};

const createUser = (username, hashedPassword, role, callback) => {
  db.query(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [username, hashedPassword, role],
    callback
  );
};

module.exports = {
  findUserByUsername,
  createUser
};
