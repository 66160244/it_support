const pool = require("../config/database");

const CommentModel = {
  // สร้าง comment ใหม่
  async create({ ticket_id, user_id, message }) {
    const [result] = await pool.query(
      "INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)",
      [ticket_id, user_id, message]
    );
    return result.insertId;
  },

  // ดึง comment ตาม id
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM comments WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  // ดึง comment ทั้งหมดของ ticket (พื้นฐาน)
  async findByTicketId(ticket_id) {
    const [rows] = await pool.query(
      "SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC",
      [ticket_id]
    );
    return rows;
  },

  // ดึง comment ของ ticket พร้อม user info
  async findByTicketIdWithUser(ticket_id) {
    const [rows] = await pool.query(
      `SELECT 
        c.*, 
        u.username AS user_name, 
        u.role AS user_role,
        u.email
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.ticket_id = ? 
       ORDER BY c.created_at ASC`,
      [ticket_id]
    );
    return rows;
  },

  // อัปเดต comment
  async update(id, { message }) {
    const [result] = await pool.query(
      "UPDATE comments SET message = ? WHERE id = ?",
      [message, id]
    );
    return result.affectedRows;
  },

  // ลบ comment
  async delete(id) {
    const [result] = await pool.query("DELETE FROM comments WHERE id = ?", [
      id,
    ]);
    return result.affectedRows;
  },

  // ดึง comment ทั้งหมด (พื้นฐาน)
  async findAll() {
    const [rows] = await pool.query(
      "SELECT * FROM comments ORDER BY created_at DESC"
    );
    return rows;
  },

  // ดึง comment ทั้งหมดพร้อม user และ ticket info (สำหรับ admin)
  async findAllWithUser() {
    const [rows] = await pool.query(
      `SELECT 
        c.*, 
        u.username AS user_name, 
        u.role AS user_role,
        t.subject AS ticket_subject
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       JOIN tickets t ON c.ticket_id = t.id
       ORDER BY c.created_at DESC`
    );
    return rows;
  },
};

module.exports = CommentModel;
