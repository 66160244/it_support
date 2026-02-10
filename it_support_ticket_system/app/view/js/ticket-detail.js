const token = localStorage.getItem("token");
const ticketId = new URLSearchParams(window.location.search).get("id");
const commentMessage = document.getElementById("commentMessage");
const commentCounter = document.getElementById("commentCounter");

// แสดงจำนวนตัวอักษรแบบเรียลไทม์


// Mapping Status & Priority เป็นภาษาไทย
const STATUS_LABELS = {
  open: "เปิดใหม่",
  in_progress: "กำลังดำเนินการ",
  resolved: "แก้ไขแล้ว",
  closed: "ปิดแล้ว",
};

const PRIORITY_LABELS = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
};

// โหลดรายละเอียดตั๋ว
async function loadTicketDetail() {
  try {
    const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const t = data.ticket;

    document.getElementById("ticketSubject").value = t.subject || "-";
    document.getElementById("ticketDescription").value = t.description || "-";
    document.getElementById("ticketAssigned").value = t.assigned_to_name || "-";

    document.getElementById("ticketStatus").value =
      STATUS_LABELS[t.status] || t.status || "-";

    document.getElementById("ticketPriority").value =
      PRIORITY_LABELS[t.priority] || t.priority || "-";

    // ✅ แสดงรูป (ถ้ามี)
    const imageBox = document.getElementById("ticketImageBox");
    const imageEl = document.getElementById("ticketImage");

    if (t.image_url) {
      imageEl.src = `http://localhost:3000${t.image_url}`;
      imageBox.style.display = "block";
    }

  } catch (err) {
    alert("❌ เกิดข้อผิดพลาดในการโหลดข้อมูลตั๋ว: " + err.message);
  }
}

// โหลดความคิดเห็น
async function loadComments() {
  try {
    const res = await fetch(
      `http://localhost:3000/api/comments/ticket/${ticketId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const commentsList = document.getElementById("commentsList");
    commentsList.innerHTML = "";

    if (data.comments.length === 0) {
      commentsList.innerHTML = `<p class="text-center text-muted mt-3">ยังไม่มีความคิดเห็น</p>`;
      return;
    }

    data.comments.forEach((c) => {
      const div = document.createElement("div");
      div.className = "comment-item";
      div.innerHTML = `
                <div class="comment-user">
                    ${
                      c.user_name || "ผู้ใช้"
                    } <span class="comment-time">(${new Date(
        c.created_at
      ).toLocaleString("th-TH")})</span>
                </div>
                <div class="comment-message">${c.message}</div>
            `;
      commentsList.appendChild(div);
    });
  } catch (err) {
    alert("❌ เกิดข้อผิดพลาดในการโหลดความคิดเห็น: " + err.message);
  }
}

// ส่งความคิดเห็นใหม่
document
  .getElementById("addCommentForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = commentMessage.value.trim();
    if (!message) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/comments/ticket/${ticketId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      commentMessage.value = "";
      commentCounter.textContent = "";
      loadComments();
    } catch (err) {
      alert("❌ ไม่สามารถเพิ่มความคิดเห็นได้: " + err.message);
    }
  });

// โหลดข้อมูลเมื่อเปิดหน้า
loadTicketDetail();
loadComments();
