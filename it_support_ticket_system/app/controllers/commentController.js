const CommentModel = require("../models/commentModel");

const commentController = {
  // สร้าง comment ใหม่
  createComment: async (req, res) => {
    try {
      const { message } = req.body; // ข้อมูลจาก body
      const { ticketId } = req.params; // ข้อมูลจาก params
      const user_id = req.user.id;

      if (!ticketId || !message) {
        return res.status(400).json({
          success: false,
          error: "Ticket ID and message are required",
        });
      }

      const commentId = await CommentModel.create({
        ticket_id: ticketId,
        user_id,
        message,
      });

      res.status(201).json({
        success: true,
        message: "Comment created successfully",
        comment_id: commentId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // ดึง comments โดย ticket_id
  getCommentsByTicket: async (req, res) => {
    try {
      const { ticketId } = req.params;
      console.log("ticketId", ticketId);

      const comments = await CommentModel.findByTicketIdWithUser(ticketId);

      res.json({
        success: true,
        comments: comments, // ตรงกับ frontend
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // ดึง comment โดย id
  getCommentById: async (req, res) => {
    try {
      const { id } = req.params;

      const comment = await CommentModel.findById(id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: "Comment not found",
        });
      }

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // อัพเดท comment
  updateComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const user_id = req.user.id;

      // ตรวจสอบว่า comment เป็นของ user นี้หรือไม่
      const comment = await CommentModel.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          error: "Comment not found",
        });
      }

      if (comment.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized to update this comment",
        });
      }

      const affectedRows = await CommentModel.update(id, { message });

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Comment not found",
        });
      }

      res.json({
        success: true,
        message: "Comment updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // ลบ comment
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      // ตรวจสอบว่า comment เป็นของ user นี้หรือไม่
      const comment = await CommentModel.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          error: "Comment not found",
        });
      }

      if (comment.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized to delete this comment",
        });
      }

      const affectedRows = await CommentModel.delete(id);

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Comment not found",
        });
      }

      res.json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  // ดึงทั้งหมด comments (สำหรับ admin)
  getAllComments: async (req, res) => {
    try {
      const comments = await CommentModel.findAllWithUser();

      res.json({
        success: true,
        data: comments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
};
console.log("Exporting commentController:", commentController);
module.exports = commentController;
