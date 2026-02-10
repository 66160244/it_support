const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config();

// Import routes
const userRoutes = require("./app/routes/userRoutes");
const ticketRoutes = require("./app/routes/ticketRoutes");
const commentRoutes = require("./app/routes/commentRoutes"); // แก้ path เป็น ./app/routes/

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use("/api", userRoutes);
app.use("/api", ticketRoutes);
app.use("/api/comments", commentRoutes);

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "app/view/mytickets.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "app/view/login.html"));
});
app.use(express.static(path.join(__dirname, "app/view")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
