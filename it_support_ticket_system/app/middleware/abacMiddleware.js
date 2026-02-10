// ===================================
// ABAC Middleware - Attribute-Based Access Control
// ===================================

const { pool } = require("../config/database");

const ABAC_POLICIES = {
  // User แก้ไข ticket ตัวเองได้ ถ้ายัง open
  canUserUpdateOwnTicket: (user, ticket) =>
    user.role === "user" &&
    ticket.user_id === user.id &&
    ticket.status === "open",

  // Staff แก้ไข ticket assigned ให้ตัวเอง
  canStaffUpdateAssignedTicket: (user, ticket) =>
    user.role === "staff" && ticket.assigned_to === user.id,

  // Ticket ปิดแล้วแก้ได้เฉพาะ admin
  canModifyClosedTicket: (user, ticket) =>
    ticket.status === "closed" ? user.role === "admin" : true,

  // ตรวจสอบสิทธิ์อ่าน ticket
  canReadTicket: (user, ticket) => {
    if (user.role === "admin") return true;
    if (user.role === "staff") return ticket.assigned_to === user.id;
    if (user.role === "user") return ticket.user_id === user.id;
    return false;
  },

  // ตรวจสอบสิทธิ์ลบ ticket (admin เท่านั้น)
  canDeleteTicket: (user, ticket) => {
    return user.role === "admin";
  },
};

/**
 * Middleware: ดึง ticket จาก DB และ attach ไปที่ req.ticket
 */
const fetchTicket = (req, res, next) => {
  const { ticketId } = req.params;

  pool.query(
    "SELECT * FROM tickets WHERE id = ?",
    [ticketId],
    (err, results) => {
      if (err) {
        console.error("fetchTicket error:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Error fetching ticket",
            error: err.message,
          });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Ticket not found" });
      }

      req.ticket = results[0];
      next();
    }
  );
};
const checkTicketOwnership = (req, res, next) => {
  const { ticketId } = req.params;
  const user = req.user;

  pool.query(
    "SELECT * FROM tickets WHERE id = ?",
    [ticketId],
    (err, results) => {
      if (err)
        return res.status(500).json({ success: false, message: err.message });
      if (results.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Ticket not found" });

      const ticket = results[0];
      req.ticket = ticket;

      if (!ABAC_POLICIES.canReadTicket(user, ticket)) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }

      next();
    }
  );
};

/**
 * Middleware: ตรวจสอบสิทธิ์ update
 */
const checkTicketUpdatePermission = (req, res, next) => {
  try {
    const { user, ticket } = req;

    if (!ABAC_POLICIES.canModifyClosedTicket(user, ticket)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only admin can modify closed tickets",
        });
    }

    if (
      user.role === "user" &&
      !ABAC_POLICIES.canUserUpdateOwnTicket(user, ticket)
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Users can update only their own open tickets",
        });
    }

    if (
      user.role === "staff" &&
      !ABAC_POLICIES.canStaffUpdateAssignedTicket(user, ticket)
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Staff can only update assigned tickets",
        });
    }

    next();
  } catch (error) {
    console.error("checkTicketUpdatePermission error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error verifying update permission",
        error: error.message,
      });
  }
};

/**
 * Middleware: ตรวจสอบสิทธิ์อ่าน
 */
const checkTicketReadPermission = (req, res, next) => {
  const { user, ticket } = req;
  if (!ABAC_POLICIES.canReadTicket(user, ticket)) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Access denied: Cannot read this ticket",
      });
  }
  next();
};

/**
 * Middleware: ตรวจสอบสิทธิ์ลบ
 */
const checkTicketDeletePermission = (req, res, next) => {
  const { user, ticket } = req;
  if (!ABAC_POLICIES.canDeleteTicket(user, ticket)) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Access denied: Cannot delete this ticket",
      });
  }
  next();
};

module.exports = {
  ABAC_POLICIES,
  fetchTicket,
  checkTicketUpdatePermission,
  checkTicketReadPermission,
  checkTicketDeletePermission,
  checkTicketOwnership,
};
