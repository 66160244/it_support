const express = require("express");
const router = express.Router();
const TicketController = require("../controllers/ticketController");
const { authenticate } = require("../middleware/authMiddleware");
const upload = require("../../upload");
const {
  fetchTicket,
  checkTicketUpdatePermission,
} = require("../middleware/abacMiddleware");

// ต้องล็อกอินก่อน
router.use(authenticate);

// สร้าง ticket
router.post(
  "/tickets",
  upload.single("image"),
  TicketController.create
);

// ดึงรายการ ticket
router.get("/tickets", TicketController.list);

// ดึง ticket รายตัว (fetchTicket middleware จะดึง ticket จาก DB ให้)
router.get("/tickets/:ticketId", fetchTicket, TicketController.getTicketById);

// แก้ไข field ของ ticket (PATCH/UPDATE) ใช้ ABAC ตรวจสอบสิทธิ์ก่อน
router.patch(
  "/tickets/:ticketId",
  upload.single("image"), 
  fetchTicket,
  checkTicketUpdatePermission,
  TicketController.updateTicket
);
// Staff assign ticket ให้ตัวเอง
router.put(
  "/tickets/:ticketId/assign-to-me",
  fetchTicket,
  checkTicketUpdatePermission, // ABAC จะตรวจสอบว่ามีสิทธิ์แก้ไข ticket นี้หรือไม่
  TicketController.assignToMe
);

// Admin assign ticket ให้ staff คนอื่น
router.put(
  "/tickets/:ticketId/assign",
  fetchTicket,
  checkTicketUpdatePermission, // ABAC จะตรวจสอบ admin สิทธิ์ assign
  TicketController.assignToStaff
);

// ลบ ticket (admin)
router.delete(
  "/tickets/:ticketId",
  fetchTicket,
  checkTicketUpdatePermission, // ABAC ตรวจสอบ admin
  TicketController.delete
);

module.exports = router;
