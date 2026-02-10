
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          window.location.href = "/index.html";
        } else {
          errorMsg.style.display = "block";
          errorMsg.textContent = data.message || "Login ไม่สำเร็จ";
        }
      } catch (err) {
        console.error(err);
        errorMsg.style.display = "block";
        errorMsg.textContent = "เกิดข้อผิดพลาด โปรดลองอีกครั้ง";
      }
    });
