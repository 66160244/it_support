// === ตรวจสอบสิทธิ์ผู้ใช้ ===
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
if (!token || !user) window.location.href = "login.html";
if (!["admin", "staff"].includes(user.role)) {
  alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
  window.location.href = "mytickets.html";
}

// === ตัวแปรหลัก ===
let allTickets = [];
let staffList = [];

// === Mapping Status & Priority เป็นภาษาไทย ===
const STATUS_LABELS = {
  open: "เปิดอยู่",
  in_progress: "กำลังดำเนินการ",
  resolved: "แก้ไขแล้ว",
  closed: "ปิดแล้ว",
};

const PRIORITY_LABELS = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
};

// === ฟังก์ชันหลัก ===
document.addEventListener("DOMContentLoaded", async () => {
  setupUserInfo();
  setupLogout();
  await loadStaffList();
  await loadAllTickets();
  setupFilters();
});

// === ตั้งค่าผู้ใช้และออกจากระบบ ===
function setupUserInfo() {
  document.getElementById("userName").textContent =
    user.name || user.username || "User";
  document.getElementById("userRole").textContent = user.role;
}

function setupLogout() {
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
}

// === โหลดรายชื่อ Staff (เฉพาะ role = staff) ===
async function loadStaffList() {
  try {
    const res = await fetch("http://localhost:3000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    staffList = data.users?.filter((u) => u.role === "staff") || [];
  } catch {
    console.error("❌ โหลดรายชื่อ staff ไม่สำเร็จ");
  }
}

// === โหลดตั๋วทั้งหมด ===
async function loadAllTickets() {
  showLoading();
  try {
    const res = await fetch("http://localhost:3000/api/tickets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    allTickets =
      user.role === "admin"
        ? data.tickets.sort((a, b) => a.id - b.id)
        : data.tickets
            .filter((t) => t.user_id === user.id || t.assigned_to === user.id)
            .sort((a, b) => a.id - b.id);

    applyFilters();
  } catch {
    showError("ไม่สามารถโหลดข้อมูลตั๋วได้");
  }
}

// === ฟังก์ชันกรอง / ค้นหา ===
function applyFilters() {
  const status = document.getElementById("statusFilter").value;
  const priority = document.getElementById("priorityFilter").value;
  const search = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allTickets.filter((t) => {
    const matchStatus = status === "all" || t.status === status;
    const matchPriority = priority === "all" || t.priority === priority;
    const matchSearch =
      !search ||
      [t.subject, t.description, t.id, t.created_by_name, t.assigned_to_name]
        .join(" ")
        .toLowerCase()
        .includes(search);
    return matchStatus && matchPriority && matchSearch;
  });

  displayTickets(filtered);
  updateStats(filtered);
}

// === แสดงตาราง Ticket ===
function displayTickets(tickets) {
  const tbody = document.getElementById("ticketTableBody");
  if (!tickets.length)
    return (tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">ไม่พบตั๋วที่ตรงกับการค้นหา</td></tr>`);

  tbody.innerHTML = tickets
    .map(
      (t) => `
    <tr>
      <td class="fw-bold text-primary">#${t.id}</td>
      <td>
        <div class="fw-bold">${t.subject || "-"}</div>
        <small class="text-muted">${t.description || ""}</small>
      </td>
      <td>
        <select class="form-select form-select-sm status-select" data-id="${
          t.id
        }">
          ${Object.entries(STATUS_LABELS)
            .map(
              ([key, label]) =>
                `<option value="${key}" ${
                  t.status === key ? "selected" : ""
                }>${label}</option>`
            )
            .join("")}
        </select>
      </td>
      <td>
        <select class="form-select form-select-sm priority-select" data-id="${
          t.id
        }">
          ${Object.entries(PRIORITY_LABELS)
            .map(
              ([key, label]) =>
                `<option value="${key}" ${
                  t.priority === key ? "selected" : ""
                }>${label}</option>`
            )
            .join("")}
        </select>
      </td>
      <td>
        <select class="form-select form-select-sm assign-select" data-id="${
          t.id
        }">
          <option value="">-- ยังไม่กำหนด --</option>
          ${staffList
            .map(
              (s) =>
                `<option value="${s.id}" ${
                  t.assigned_to === s.id ? "selected" : ""
                }>${s.username}</option>`
            )
            .join("")}
        </select>
      </td>
      <td>${t.created_by_name || "-"}</td>
      <td>${formatDate(t.created_at)}</td>
      <td class="text-nowrap">
        <a href="ticket-detail.html?id=${
          t.id
        }" class="btn btn-sm btn-primary me-1">
          <i class="bi bi-eye me-1"></i>ดูรายละเอียด
        </a>
        ${
          user.role === "admin" ||
          (user.role === "staff" && t.assigned_to === user.id)
            ? `<button class="btn btn-sm btn-danger delete-btn" data-id="${t.id}">
                 <i class="bi bi-trash me-1"></i>ลบ
               </button>`
            : ""
        }
      </td>
    </tr>`
    )
    .join("");

  setupDropdownEvents();
}

// === อัปเดต dropdown ตามสิทธิ์ ===
function setupDropdownEvents() {
  document
    .querySelectorAll(".status-select")
    .forEach((el) =>
      el.addEventListener("change", (e) =>
        updateTicket(e.target.dataset.id, { status: e.target.value })
      )
    );

  document.querySelectorAll(".priority-select").forEach((el) => {
    if (user.role === "admin") {
      el.addEventListener("change", (e) =>
        updateTicket(e.target.dataset.id, { priority: e.target.value })
      );
    } else {
      el.disabled = true;
    }
  });

  document.querySelectorAll(".assign-select").forEach((el) => {
    if (user.role === "admin") {
      el.addEventListener("change", (e) =>
        assignTicket(e.target.dataset.id, e.target.value || null)
      );
    } else {
      el.disabled = true;
    }
  });

  document.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.target.closest("button").dataset.id;
      if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ ตั๋ว#" + id + " ?")) return;

      try {
        const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error();
        alert("✅ ลบตั๋ว เรียบร้อยแล้ว");
        await loadAllTickets();
      } catch {
        alert("❌ ไม่สามารถลบตั๋ว ได้");
      }
    })
  );
}

// === Update / Assign ===
async function updateTicket(id, updateData) {
  try {
    const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error();
    await loadAllTickets();
  } catch {
    alert("❌ ไม่สามารถอัปเดตตั๋ว ได้");
  }
}

async function assignTicket(id, staffId) {
  try {
    const res = await fetch(`http://localhost:3000/api/tickets/${id}/assign`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ staffId }),
    });
    if (!res.ok) throw new Error();
    await loadAllTickets();
  } catch {
    alert("❌ ไม่สามารถมอบหมายตั๋วได้");
  }
}

// === Stats ===
function updateStats(tickets) {
  const count = (s) => tickets.filter((t) => t.status === s).length;
  document.getElementById("countOpen").textContent = count("open");
  document.getElementById("countInProgress").textContent = count("in_progress");
  document.getElementById("countResolved").textContent = count("resolved");
  document.getElementById("countActive").textContent = tickets.filter(
    (t) => t.status !== "closed"
  ).length;
  document.getElementById("countClose").textContent = count("closed");
  document.getElementById("countTotal").textContent = tickets.length;
}

// === Filters ===
function setupFilters() {
  ["statusFilter", "priorityFilter"].forEach((id) =>
    document.getElementById(id).addEventListener("change", applyFilters)
  );
  document.getElementById("searchBtn").addEventListener("click", applyFilters);
  document
    .getElementById("searchInput")
    .addEventListener("keypress", (e) => e.key === "Enter" && applyFilters());
  document.getElementById("resetBtn").addEventListener("click", resetFilters);
}

function resetFilters() {
  ["statusFilter", "priorityFilter", "searchInput"].forEach(
    (id) =>
      (document.getElementById(id).value = id === "searchInput" ? "" : "all")
  );
  applyFilters();
}

// === Helpers ===
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("th-TH");
}

function showLoading() {
  document.getElementById(
    "ticketTableBody"
  ).innerHTML = `<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-primary"></div><p class="mt-2">กำลังโหลด...</p></td></tr>`;
}

function showError(msg) {
  document.getElementById(
    "ticketTableBody"
  ).innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">${msg}</td></tr>`;
}
