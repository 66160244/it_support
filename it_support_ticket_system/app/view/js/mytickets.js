// === ตรวจสอบสิทธิ์ผู้ใช้ ===
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
if (!token || !user) window.location.href = "login.html";

let allTickets = [];

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

// === Setup User Info & Logout ===
function setupUser() {
  document.getElementById("userName").textContent = user.name || user.username;
  document.getElementById("userRole").textContent = user.role || "User";

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
}

// === Load My Tickets (ของตัวเองเท่านั้น) ===
async function loadMyTickets() {
  showLoading();
  try {
    const res = await fetch("http://localhost:3000/api/tickets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "โหลดตั๋วไม่ได้");

    // ✅ แสดงเฉพาะตั๋วของตัวเองเท่านั้น
    allTickets = data.tickets
      .filter((t) => t.user_id === user.id)
      .sort((a, b) => b.id - a.id); // เรียงจากใหม่ → เก่า

    applyFilters();
  } catch (err) {
    showError("โหลดตั๋วไม่สำเร็จ");
    console.error(err);
  }
}

// === Filters ===
function applyFilters() {
  const status = document.getElementById("statusFilter")?.value || "all";
  const priority = document.getElementById("priorityFilter")?.value || "all";
  const search =
    document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtered = [...allTickets];

  if (status !== "all") filtered = filtered.filter((t) => t.status === status);
  if (priority !== "all")
    filtered = filtered.filter((t) => t.priority === priority);
  if (search)
    filtered = filtered.filter(
      (t) =>
        t.subject.toLowerCase().includes(search) ||
        (t.description && t.description.toLowerCase().includes(search)) ||
        t.id.toString().includes(search)
    );

  // ✅ sort id จากมาก → น้อย
  filtered.sort((a, b) => a.id - b.id);

  displayTickets(filtered);
  updateStats(filtered);
}

// === Reset Filters ===
function resetFilters() {
  ["statusFilter", "priorityFilter", "searchInput"].forEach(
    (id) =>
      (document.getElementById(id).value = id === "searchInput" ? "" : "all")
  );
  applyFilters();
}

// === Display Tickets ===
function displayTickets(tickets) {
  const tbody = document.getElementById("ticketTableBody");
  if (!tbody) return;

  if (!tickets.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5">
      <i class="bi bi-inbox display-4 text-muted mb-3"></i>
      <h4 class="text-muted">ไม่พบตั๋ว</h4></td></tr>`;
    return;
  }

  tbody.innerHTML = tickets
    .map((t) => {
      const canDelete = ["open", "closed"].includes(t.status);
      const canEdit = t.status === "open";

      return `
        <tr>
          <td class="fw-bold text-primary">#${t.id}</td>
          <td>
            <div class="fw-semibold">${t.subject || ""}</div>
            <small class="text-muted">${
              t.description?.substring(0, 60) || ""
            }</small>
          </td>
          <td>
            <span class="status-badge status-${t.status}">
              ${STATUS_LABELS[t.status] || t.status}
            </span>
          </td>
          <td>
            <span class="priority-badge priority-${t.priority}">
              ${PRIORITY_LABELS[t.priority] || t.priority}
            </span>
          </td>
          <td>${t.assigned_to_name || "ยังไม่กำหนด"}</td>
          <td>${new Date(t.created_at).toLocaleDateString("th-TH")}</td>
          <td class="text-nowrap">
            <a href="ticket-detail.html?id=${
              t.id
            }" class="btn btn-primary btn-sm me-1">
              <i class="bi bi-eye me-1"></i>ดูรายละเอียด
            </a>
            ${
              canEdit
                ? `<a href="edit-ticket.html?id=${t.id}" class="btn btn-warning btn-sm me-1 text-white">
                     <i class="bi bi-pencil-square me-1"></i>แก้ไข
                   </a>`
                : ""
            }
            ${
              canDelete
                ? `<button class="btn btn-danger btn-sm delete-btn" data-id="${t.id}">
                     <i class="bi bi-trash me-1"></i>ลบ
                   </button>`
                : ""
            }
          </td>
        </tr>`;
    })
    .join("");

  // === ปุ่มลบ Ticket ===
  document.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.target.closest("button").dataset.id;
      if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบตั๋ว #${id} ?`)) return;

      try {
        const res = await fetch(`http://localhost:3000/api/tickets/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error();
        alert("✅ ลบตั๋วเรียบร้อยแล้ว");
        await loadMyTickets();
      } catch (err) {
        console.error(err);
        alert("❌ ไม่สามารถลบตั๋วได้");
      }
    })
  );
}

// === Update Stats ===
function updateStats(tickets) {
  document.getElementById("countOpen").textContent = tickets.filter(
    (t) => t.status === "open"
  ).length;
  document.getElementById("countInProgress").textContent = tickets.filter(
    (t) => t.status === "in_progress"
  ).length;
  document.getElementById("countResolved").textContent = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  ).length;
  document.getElementById("countTotal").textContent = tickets.length;
}

// === Loading / Error ===
function showLoading() {
  document.getElementById(
    "ticketTableBody"
  ).innerHTML = `<tr><td colspan="8" class="text-center py-4">
    <div class="spinner-border text-primary"></div>
    <p class="mt-2">กำลังโหลดตั๋ว...</p></td></tr>`;
}

function showError(msg) {
  document.getElementById(
    "ticketTableBody"
  ).innerHTML = `<tr><td colspan="8" class="text-center py-4">
    <h4 class="text-danger">เกิดข้อผิดพลาด</h4><p>${msg}</p>
    <button onclick="loadMyTickets()" class="btn btn-primary">ลองอีกครั้ง</button></td></tr>`;
}

// === Event Listeners ===
document.addEventListener("DOMContentLoaded", () => {
  setupUser();
  loadMyTickets();

  ["statusFilter", "priorityFilter"].forEach((id) =>
    document.getElementById(id)?.addEventListener("change", applyFilters)
  );
  document.getElementById("searchBtn")?.addEventListener("click", applyFilters);
  document
    .getElementById("searchInput")
    ?.addEventListener("keypress", (e) => e.key === "Enter" && applyFilters());
  document.getElementById("resetBtn")?.addEventListener("click", resetFilters);
});
