const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { checkTicketOwnership } = require("../middleware/abacMiddleware");
const { checkPermission } = require("../middleware/rbacMiddleware");
const commentController = require("../controllers/commentController");

// ใช้ authentication สำหรับทุก routes
router.use(authenticate);

// สร้าง comment ใหม่ (เฉพาะเจ้าของ ticket หรือ staff/admin assigned)
router.post(
  "/ticket/:ticketId",
  checkTicketOwnership,
  checkPermission("comment:create"),
  commentController.createComment
);

// ดึง comments ตาม ticket_id
router.get(
  "/ticket/:ticketId",
  checkTicketOwnership,
  commentController.getCommentsByTicket
);

// ดึง comment ตาม ID
router.get("/:id", commentController.getCommentById);

// อัปเดต comment (เฉพาะ owner)
router.put("/:id", commentController.updateComment);

// ลบ comment (เฉพาะ owner)
router.delete("/:id", commentController.deleteComment);

// ดึง comment ทั้งหมด (สำหรับ admin)
router.get("/", commentController.getAllComments);

module.exports = router;
