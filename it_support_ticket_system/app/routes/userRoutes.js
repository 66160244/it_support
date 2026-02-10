const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const path = require("path");

// Public routes
router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../view/register.html"));
});
router.post("/register", UserController.register);

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../view/login.html"));
});
router.post("/login", UserController.login);

// Protected routes (ต้องล็อกอิน)
router.get("/users", authenticate, UserController.list);
router.get("/me", authenticate, UserController.me);

// Serve pages
router.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "../view/index.html"));
});

module.exports = router;
