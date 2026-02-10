// นำเข้าไลบรารีที่จำเป็น
const bcrypt = require("bcryptjs"); // สำหรับแฮชรหัสผ่าน
const jwt = require("jsonwebtoken"); // สำหรับสร้างและตรวจสอบ JWT token
const UserModel = require("../models/userModel"); // โมเดลสำหรับติดต่อกับฐานข้อมูลผู้ใช้
const pool = require("../config/database"); // การเชื่อมต่อฐานข้อมูลแบบ pool

// สร้าง controller สำหรับจัดการผู้ใช้
const UserController = {
  // ฟังก์ชันสมัครสมาชิก
  async register(req, res) {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password)
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });

      // ตรวจสอบว่าชื่อผู้ใช้ซ้ำหรือไม่
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser)
        return res.status(409).json({ message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });

      // ตรวจสอบว่าอีเมลซ้ำหรือไม่
      const [checkEmail] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (checkEmail.length > 0)
        return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });

      // แฮชรหัสผ่านก่อนเก็บ
      const hashed = await bcrypt.hash(password, 10);

      // ตรวจสอบ role ให้ปลอดภัย
      const safeRole = ["user", "staff", "admin"].includes(role)
        ? role
        : "user";

      // สร้างผู้ใช้ใหม่
      const userId = await UserModel.create({
        username,
        email,
        password: hashed,
        role: safeRole,
      });

      res.status(201).json({
        success: true,
        message: "สมัครสมาชิกสำเร็จ",
        userId,
      });
    } catch (error) {
      console.error("Register error:", error);
      res
        .status(500)
        .json({
          message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์",
          error: error.message,
        });
    }
  },

  // ฟังก์ชันดึงรายชื่อผู้ใช้ทั้งหมด
  async list(req, res) {
    try {
      const users = await UserModel.findAll();
      res.json({ success: true, users });
    } catch (error) {
      console.error("List users error:", error);
      res
        .status(500)
        .json({ message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้", error: error.message });
    }
  },

  // ฟังก์ชันเข้าสู่ระบบ
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password)
        return res
          .status(400)
          .json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });

      // ค้นหาผู้ใช้
      const user = await UserModel.findByUsername(username);
      if (!user)
        return res
          .status(401)
          .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

      // ตรวจสอบรหัสผ่าน
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid)
        return res
          .status(401)
          .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

      // สร้าง JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
      );

      res.json({
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res
        .status(500)
        .json({
          message: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ",
          error: error.message,
        });
    }
  },

  // ฟังก์ชันดูข้อมูลผู้ใช้ของตัวเอง
  async me(req, res) {
    try {
      const user = req.user;
      const found = await UserModel.findById(user.id);

      if (!found)
        return res
          .status(404)
          .json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });

      res.json({ success: true, user: found });
    } catch (error) {
      console.error("Me error:", error);
      res
        .status(500)
        .json({ message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้", error: error.message });
    }
  },
};

module.exports = UserController;
