const pool = require("../config/database");

const TicketModel = {
  async create({ user_id, subject, description, priority }) {
    const [result] = await pool.query(
      "INSERT INTO tickets (user_id, subject, description, priority) VALUES (?, ?, ?, ?)",
      [user_id, subject, description, priority]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM tickets WHERE id = ?", [id]);
    return rows[0];
  },

  async findAll() {
    const [rows] = await pool.query(
      "SELECT * FROM tickets ORDER BY created_at DESC"
    );
    return rows;
  },
};

module.exports = TicketModel;
