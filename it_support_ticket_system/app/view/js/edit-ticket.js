const token = localStorage.getItem("token");
const ticketId = new URLSearchParams(window.location.search).get("id");
const user = JSON.parse(localStorage.getItem("user") || "{}");
const userRole = user.role || "user";
const userId = Number(user.id); // แปลงเป็น number เพื่อให้เทียบกับ ticket.created_by

// ช่วย set value ถ้า element มีอยู่
function setValueIfExist(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

// ช่วย disable element ถ้ามีอยู่
function disableIfExist(id) {
  const el = document.getElementById(id);
  if (el) el.disabled = true;
}

// โหลดรายละเอียด Ticket
async function loadTicketDetail() {
  try {
    const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const t = data.ticket;

    setValueIfExist("subject", t.subject);
    setValueIfExist("description", t.description);

    // ✅ แสดงรูป
    const imageBox = document.getElementById("ticketImageBox");
    const imageEl = document.getElementById("ticketImage");

    if (t.image_url && imageBox && imageEl) {
      imageEl.src = `http://localhost:3000${t.image_url}`;
      imageBox.style.display = "block";
    }

    applyPermissionRules(t);

  } catch (err) {
    alert("เกิดข้อผิดพลาดในการโหลดตั๋ว: " + err.message);
  }
}

// Permission-based field locking
function applyPermissionRules(ticket) {
  const isOwner = Number(ticket.created_by) === Number(userId);
  const isAssigned = Number(ticket.assigned_to) === Number(userId);

  console.log("isOwner:", isOwner, "isAssigned:", isAssigned); // <-- เพิ่มตรงนี้

  // reset all first
  document
    .querySelectorAll('input, textarea, select, button[type="submit"]')
    .forEach((el) => (el.disabled = false));

  // ... (เงื่อนไข disable เดิม)
}


// โหลดรายชื่อ Staff สำหรับ assign (เฉพาะ admin หรือ staff)
async function loadStaffList() {
  if (userRole === "admin" || userRole === "staff") {
    const res = await fetch("http://localhost:3000/api/users/staff", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      const assignedSelect = document.getElementById("assignedTo");
      if (assignedSelect) {
        data.staff.forEach((s) => {
          const opt = document.createElement("option");
          opt.value = s.id;
          opt.textContent = s.name;
          assignedSelect.appendChild(opt);
        });
      }
    }
  }
}

// Permission-based field locking
function applyPermissionRules(ticket) {
  const isOwner = Number(ticket.user_id) === Number(userId);
  const isAssigned = Number(ticket.assigned_to) === Number(userId);

  // reset all first
  document
    .querySelectorAll('input, textarea, select, button[type="submit"]')
    .forEach((el) => (el.disabled = false));

  if (userRole === "user") {
    if (!isOwner) {
      // ไม่ใช่เจ้าของ → ปิดหมด
      document
        .querySelectorAll('input, textarea, select, button[type="submit"]')
        .forEach((el) => (el.disabled = true));
    } else {
      // เจ้าของ → ปิดเฉพาะ field ที่ user แก้ไม่ได้
      disableIfExist("status");
      disableIfExist("priority");
      disableIfExist("assignedTo");
    }
  }

  if (userRole === "staff") {
    if (!isOwner && !isAssigned) {
      // staff ที่ไม่ใช่เจ้าของและไม่ได้ assigned → ปิดหมด
      document
        .querySelectorAll('input, textarea, select, button[type="submit"]')
        .forEach((el) => (el.disabled = true));
    } else {
      // เจ้าของหรือ assigned → ปิดบาง field
      disableIfExist("status");
      disableIfExist("assignedTo");
    }
  }

  // admin → ไม่ต้อง disable
}

// บันทึกการแก้ไข
document
  .getElementById("editTicketForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {};
    const subjectEl = document.getElementById("subject");
    const descEl = document.getElementById("description");
    const statusEl = document.getElementById("status");
    const priorityEl = document.getElementById("priority");
    const assignedEl = document.getElementById("assignedTo");

    if (subjectEl && !subjectEl.disabled) payload.subject = subjectEl.value;
    if (descEl && !descEl.disabled) payload.description = descEl.value;
    if (statusEl && !statusEl.disabled) payload.status = statusEl.value;
    if (priorityEl && !priorityEl.disabled) payload.priority = priorityEl.value;
    if (assignedEl && !assignedEl.disabled)
      payload.assigned_to = assignedEl.value || null;

    try {
      const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      alert("อัปเดตข้อมูลตั๋วสำเร็จแล้ว!");
      window.location.href =
        userRole === "user" ? "./mytickets.html" : "./dashboard.html";
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปเดตตั๋ว: " + err.message);
    }
  });

// โหลดข้อมูล
loadTicketDetail();
loadStaffList();
