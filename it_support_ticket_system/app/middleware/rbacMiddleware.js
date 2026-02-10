// ===================================
// RBAC Middleware - Role-Based Access Control
// ===================================

// 1️⃣ กำหนดสิทธิ์ของแต่ละ Role
const PERMISSIONS = {
  user: [
    "ticket:create",
    "ticket:read:own",
    "ticket:update:own",
    "comment:create",
    "comment:update:own",
    "comment:delete:own",
  ],
  staff: [
    "ticket:read:assigned",
    "ticket:update:status",
    "comment:create",
    "comment:update:assigned",
    "comment:delete:assigned",
  ],
  admin: [
    "ticket:create",
    "ticket:read:all",
    "ticket:update:full",
    "ticket:delete",
    "ticket:assign",
    "user:read:all",
    "comment:create",
    "comment:update:any",
    "comment:delete:any",
  ],
};

// 2️⃣ ตรวจสอบว่า role มี permission ที่ต้องการไหม
const hasPermission = (role, permission) => {
  if (role === "admin") return true; // ให้ admin เข้าถึงได้ทุกสิทธิ์
  const rolePermissions = PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

// 🔹 Helper สำหรับตรวจสอบการ login
const ensureAuthenticated = (req, res) => {
  if (!req.user) {
    res
      .status(401)
      .json({ success: false, message: "Authentication required" });
    return false;
  }
  return true;
};

// 3️⃣ ตรวจสอบสิทธิ์แบบ permission เดียว
const checkPermission = (requiredPermission) => (req, res, next) => {
  if (!ensureAuthenticated(req, res)) return;

  if (hasPermission(req.user.role, requiredPermission)) return next();

  res.status(403).json({
    success: false,
    message: "Access denied: Insufficient permissions",
    required: requiredPermission,
    userRole: req.user.role,
  });
};

// 4️⃣ ตรวจสอบสิทธิ์หลายอัน (ต้องมีอย่างน้อย 1)
const checkAnyPermission = (permissions) => (req, res, next) => {
  if (!ensureAuthenticated(req, res)) return;

  const hasAny = permissions.some((p) => hasPermission(req.user.role, p));
  if (hasAny) return next();

  res.status(403).json({
    success: false,
    message: "Access denied: Insufficient permissions",
    required: permissions,
    userRole: req.user.role,
  });
};

// 5️⃣ ตรวจสอบ Role โดยตรง
const checkRole = (allowedRoles) => (req, res, next) => {
  if (!ensureAuthenticated(req, res)) return;

  if (allowedRoles.includes(req.user.role)) return next();

  res.status(403).json({
    success: false,
    message: "Access denied: Invalid role",
    allowedRoles,
    userRole: req.user.role,
  });
};

// 6️⃣ Export
module.exports = {
  PERMISSIONS,
  hasPermission,
  checkPermission,
  checkAnyPermission,
  checkRole,
};
