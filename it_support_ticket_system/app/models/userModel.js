const pool = require("../config/database");

const UserModel = {
  async create({ username, email, password, role = "user" }) {
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, password, role]
    );
    return result.insertId;
  },
  async findByUsername(username) {
    const [rows] = await pool.query(
      "SELECT id, username, email, password, role FROM users WHERE username = ?",
      [username]
    );
    return rows[0];
  },
  async findById(id) {
    const [rows] = await pool.query(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  },

  async findAll() {
    const [rows] = await pool.query(
      "SELECT id, username, email, role FROM users"
    );
    return rows;
  },
};

module.exports = UserModel;



