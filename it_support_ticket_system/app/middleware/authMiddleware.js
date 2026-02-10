// ===================================
// Authentication Middleware
// ===================================

const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware สำหรับตรวจสอบ JWT Token
 */
const authenticate = (req, res, next) => {
  try {
    // ดึง token จาก Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login first.",
      });
    }

    // แยก token ออกจาก "Bearer <token>"
    const token = authHeader.split(" ")[1];

    // ตรวจสอบและ decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // เก็บข้อมูล user ไว้ใน request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };

    next(); // ส่งต่อไปยัง middleware ถัดไป
  } catch (error) {
    // จัดการ error ต่างๆ ของ JWT
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

/**
 * Middleware สำหรับ optional authentication
 * (ไม่บังคับต้องมี token แต่ถ้ามีจะ decode ให้)
 */
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // ถ้า token ไม่ valid ก็ไม่ต้องทำอะไร แค่ไม่มี req.user
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};
