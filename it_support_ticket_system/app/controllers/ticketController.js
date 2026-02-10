const pool = require("../config/database");

const TicketController = {
  // สร้าง ticket ใหม่
async create(req, res) {
  try {
    const { subject, description, priority } = req.body;
    const user_id = req.user.id;

    // ถ้ามีอัปโหลดรูป
    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO tickets 
      (user_id, subject, description, priority, image_url)
      VALUES (?, ?, ?, ?, ?)`,
      [
        user_id,
        subject,
        description,
        priority || "medium",
        image_url
      ]
    );

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticketId: result.insertId,
    });

  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},

  // ดึงรายการ ticket ทั้งหมด
  async list(req, res) {
    try {
      const user = req.user;
      let tickets;

      // Query ตาม role (เหมือนเดิม แต่ไม่เช็ค permission ที่นี่)
      if (user.role === "user") {
        [tickets] = await pool.query(
          `SELECT t.*, u.username AS created_by_name, s.username AS assigned_to_name
           FROM tickets t
           JOIN users u ON t.user_id = u.id
           LEFT JOIN users s ON t.assigned_to = s.id
           WHERE t.user_id = ?
           ORDER BY t.created_at DESC`,
          [user.id]
        );
      } else if (user.role === "staff") {
        [tickets] = await pool.query(
          `SELECT t.*, u.username AS created_by_name, s.username AS assigned_to_name
           FROM tickets t
           JOIN users u ON t.user_id = u.id
           LEFT JOIN users s ON t.assigned_to = s.id
           WHERE t.assigned_to = ?
           ORDER BY t.created_at DESC`,
          [user.id]
        );
      } else if (user.role === "admin") {
        [tickets] = await pool.query(
          `SELECT t.*, u.username AS created_by_name, s.username AS assigned_to_name
           FROM tickets t
           JOIN users u ON t.user_id = u.id
           LEFT JOIN users s ON t.assigned_to = s.id
           ORDER BY t.created_at DESC`
        );
      }

      res.json({ success: true, tickets });
    } catch (error) {
      console.error("List tickets error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  // ดึง ticket ตาม ID
  async getTicketById(req, res) {
    try {
      const { ticketId } = req.params;

      const [tickets] = await pool.query(
        `SELECT t.*, u.username AS user_name, s.username AS assigned_staff_name
         FROM tickets t
         JOIN users u ON t.user_id = u.id
         LEFT JOIN users s ON t.assigned_to = s.id
         WHERE t.id = ?`,
        [ticketId]
      );

      if (tickets.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      res.json({ success: true, ticket: tickets[0] });
    } catch (error) {
      console.error("Get ticket by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  // อัปเดต ticket (PATCH / PUT)
  async updateTicket(req, res) {
    try {
      const { ticketId } = req.params;
      const fields = req.body;
      const user = req.user;

      if (!fields || Object.keys(fields).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No fields provided" });
      }

      // ดึง ticket จริง
      const [tickets] = await pool.query("SELECT * FROM tickets WHERE id = ?", [
        ticketId,
      ]);
      if (tickets.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Ticket not found" });
      }

      // Staff ไม่สามารถแก้ไข priority
      if (fields.priority && user.role !== "admin") {
        return res
          .status(403)
          .json({
            success: false,
            message: "Only admin can change ticket priority",
          });
      }

      // สร้าง query update dynamic
      const setClause = Object.keys(fields)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(fields);

      await pool.query(
        `UPDATE tickets SET ${setClause}, updated_at = NOW() WHERE id = ?`,
        [...values, ticketId]
      );

      res.json({ success: true, message: "Ticket updated successfully" });
    } catch (error) {
      console.error("Update ticket error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  // มอบหมาย ticket ให้ตัวเอง
  async assignToMe(req, res) {
    try {
      const { ticketId } = req.params;
      const user = req.user;

      await pool.query(
        "UPDATE tickets SET assigned_to = ?, status = 'in_progress' WHERE id = ?",
        [user.id, ticketId]
      );

      res.json({ success: true, message: "Ticket assigned to you" });
    } catch (error) {
      console.error("Assign ticket error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  // Admin assign ticket ให้ staff
  async assignToStaff(req, res) {
    try {
      const { ticketId } = req.params;
      const { staffId } = req.body;

      if (staffId === null || staffId === "" || staffId === undefined) {
        await pool.query(
          "UPDATE tickets SET assigned_to = NULL, status = 'open' WHERE id = ?",
          [ticketId]
        );
        return res.json({
          success: true,
          message: "Ticket unassigned successfully",
          assignment: { ticketId, staffId: null, staffName: null },
        });
      }

      const [staffs] = await pool.query(
        "SELECT * FROM users WHERE id = ? AND role = 'staff'",
        [staffId]
      );
      if (staffs.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid staffId" });
      }

      await pool.query(
        "UPDATE tickets SET assigned_to = ?, status = 'in_progress' WHERE id = ?",
        [staffId, ticketId]
      );

      res.json({
        success: true,
        message: "Ticket assigned to staff successfully",
        assignment: { ticketId, staffId, staffName: staffs[0].username },
      });
    } catch (error) {
      console.error("Admin assign ticket error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  // ลบ ticket
  async delete(req, res) {
    try {
      const { ticketId } = req.params;
      const [result] = await pool.query("DELETE FROM tickets WHERE id = ?", [
        ticketId,
      ]);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Ticket not found" });
      }

      res.json({ success: true, message: "Ticket deleted successfully" });
    } catch (error) {
      console.error("Delete ticket error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },
};

module.exports = TicketController;
