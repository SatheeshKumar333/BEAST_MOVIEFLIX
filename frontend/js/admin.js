/* ======================================
   ADMIN DASHBOARD – JAVASCRIPT
   Developed by Satheesh Kumar
====================================== */

// Check admin access
document.addEventListener("DOMContentLoaded", async () => {
    const logged = localStorage.getItem("bmf_logged") === "true";
    const role = localStorage.getItem("bmf_role");

    if (!logged) {
        alert("Please login to access admin panel!");
        window.location.href = "login.html";
        return;
    }

    if (role !== "ADMIN") {
        alert("Access denied! Admin privileges required.");
        window.location.href = "dashboard.html";
        return;
    }

    await loadStats();
    await loadUsers();
});

// API Base URL
const API_BASE = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "http://localhost:8080/api";

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem("bmf_token");
    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.remove("active");
    });
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.remove("active");
    });

    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.add("active");
    event.target.classList.add("active");

    // Load data for tab
    switch (tabName) {
        case "users":
            loadUsers();
            break;
        case "logs":
            loadLogs();
            break;
        case "reports":
            loadReports();
            break;
        case "settings":
            loadSettings();
            break;
    }
}

// ========== STATS ==========
async function loadStats() {
    // For now, use localStorage data
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const logs = JSON.parse(localStorage.getItem("bmf_diary") || "[]");
    const oldLogs = JSON.parse(localStorage.getItem("bmf_movie_logs") || "[]");

    document.getElementById("totalUsers").textContent = users.length;
    document.getElementById("activeUsers").textContent = users.filter((u) => u.emailVerified !== false).length;
    document.getElementById("totalLogs").textContent = logs.length + oldLogs.length;
    document.getElementById("pendingReports").textContent = "0";

    // Try to get from backend
    try {
        const response = await fetch(`${API_BASE}/admin/stats`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            const stats = await response.json();
            document.getElementById("totalUsers").textContent = stats.totalUsers || 0;
            document.getElementById("activeUsers").textContent = stats.activeUsers || 0;
            document.getElementById("totalLogs").textContent = stats.totalLogs || 0;
            document.getElementById("pendingReports").textContent = stats.pendingReports || 0;
        }
    } catch (e) {
        console.log("Using localStorage for stats");
    }
}

// ========== USERS ==========
let currentUserPage = 0;

async function loadUsers(page = 0) {
    currentUserPage = page;
    const tbody = document.getElementById("usersTable");

    // Use localStorage users
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const search = document.getElementById("userSearch")?.value?.toLowerCase() || "";

    const filteredUsers = users.filter(
        (u) => u.username.toLowerCase().includes(search) || (u.email && u.email.toLowerCase().includes(search))
    );

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted)">No users found</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredUsers
        .map(
            (user) => `
    <tr>
      <td><input type="checkbox" class="user-checkbox" data-user-id="${user.id}" onchange="updateSelectedCount()"></td>
      <td>${user.id || "-"}</td>
      <td>${user.username}</td>
      <td>${user.email || "-"}</td>
      <td><span class="role-badge ${user.role === "ADMIN" ? "admin" : "user"}">${user.role || "USER"}</span></td>
      <td><span class="status-badge ${getStatusClass(user)}">${getStatusText(user)}</span></td>
      <td>${user.logsCount || 0}</td>
      <td class="action-btns">
        <button class="action-btn edit" onclick="openUserModal('${user.id}')">✏️</button>
        ${user.role !== "ADMIN" ? `<button class="action-btn promote" onclick="promoteUser('${user.id}')">👑</button>` : ""}
        <button class="action-btn" onclick="downloadSingleUser('${user.id}')" title="Download User Data">📥</button>
        <button class="action-btn delete" onclick="deleteUser('${user.id}')">🗑️</button>
      </td>
    </tr>
  `
        )
        .join("");
}

function getStatusClass(user) {
    if (user.bio && user.bio.startsWith("[BLOCKED]")) return "blocked";
    if (user.emailVerified === false) return "inactive";
    return "active";
}

function getStatusText(user) {
    if (user.bio && user.bio.startsWith("[BLOCKED]")) return "Blocked";
    if (user.emailVerified === false) return "Inactive";
    return "Active";
}

function searchUsers() {
    loadUsers(0);
}

async function promoteUser(userId) {
    if (!confirm("Promote this user to ADMIN?")) return;

    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
        users[userIndex].role = "ADMIN";
        localStorage.setItem("bmf_users", JSON.stringify(users));
        loadUsers();
        alert("User promoted to ADMIN!");
    }
}

async function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone!")) return;

    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const filtered = users.filter((u) => u.id !== userId);
    localStorage.setItem("bmf_users", JSON.stringify(filtered));
    loadUsers();
    loadStats();
    alert("User deleted!");
}

// ========== MOVIE LOGS ==========
async function loadLogs(page = 0) {
    const tbody = document.getElementById("logsTable");

    // Use localStorage logs
    const logs = JSON.parse(localStorage.getItem("bmf_diary") || "[]");
    const oldLogs = JSON.parse(localStorage.getItem("bmf_movie_logs") || "[]");
    const allLogs = [...logs, ...oldLogs].sort((a, b) => new Date(b.watchedAt || b.createdAt) - new Date(a.watchedAt || a.createdAt));

    if (allLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">No movie logs found</td></tr>`;
        return;
    }

    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");

    tbody.innerHTML = allLogs
        .slice(0, 50)
        .map((log) => {
            const user = users.find((u) => u.id === log.userId);
            const date = log.watchedAt || log.createdAt;
            return `
    <tr>
      <td>${log.id || log.movieId || "-"}</td>
      <td>${log.title || "Unknown"}</td>
      <td>⭐ ${log.rating || 0}/10</td>
      <td>${user?.username || "Unknown"}</td>
      <td>${date ? new Date(date).toLocaleDateString() : "-"}</td>
      <td class="action-btns">
        <button class="action-btn delete" onclick="deleteLog('${log.id || log.movieId}', '${log.userId}')">🗑️</button>
      </td>
    </tr>
  `;
        })
        .join("");
}

function deleteLog(logId, userId) {
    if (!confirm("Delete this movie log?")) return;

    // Remove from diary
    let diary = JSON.parse(localStorage.getItem("bmf_diary") || "[]");
    diary = diary.filter((l) => !(l.id == logId && l.userId === userId));
    localStorage.setItem("bmf_diary", JSON.stringify(diary));

    // Remove from old logs
    let oldLogs = JSON.parse(localStorage.getItem("bmf_movie_logs") || "[]");
    oldLogs = oldLogs.filter((l) => !(l.movieId == logId && l.userId === userId));
    localStorage.setItem("bmf_movie_logs", JSON.stringify(oldLogs));

    loadLogs();
    loadStats();
    alert("Log deleted!");
}

// ========== REPORTS ==========
async function loadReports() {
    const tbody = document.getElementById("reportsTable");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">No reports yet</td></tr>`;
}

// ========== SETTINGS ==========
async function loadSettings() {
    // Load from localStorage
    const settings = JSON.parse(localStorage.getItem("bmf_admin_settings") || "{}");

    document.getElementById("maintenanceMode").checked = settings.maintenanceMode || false;
    document.getElementById("allowRegistrations").checked = settings.allowRegistrations !== false;
    document.getElementById("enableReviews").checked = settings.enableReviews !== false;
    document.getElementById("enableGroups").checked = settings.enableGroups !== false;
    document.getElementById("sendOtpEmails").checked = settings.sendOtpEmails !== false;
    document.getElementById("monthlyReports").checked = settings.monthlyReports !== false;
}

function saveSettings() {
    const settings = {
        maintenanceMode: document.getElementById("maintenanceMode").checked,
        allowRegistrations: document.getElementById("allowRegistrations").checked,
        enableReviews: document.getElementById("enableReviews").checked,
        enableGroups: document.getElementById("enableGroups").checked,
        sendOtpEmails: document.getElementById("sendOtpEmails").checked,
        monthlyReports: document.getElementById("monthlyReports").checked,
    };

    localStorage.setItem("bmf_admin_settings", JSON.stringify(settings));
    alert("Settings saved successfully!");
}

// ========== DATA EXPORT ==========
function exportData(type) {
    let csv = "";
    let filename = "";

    if (type === "users") {
        const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
        csv = "ID,Username,Email,Role,Verified\n";
        csv += users.map((u) => `${u.id},${u.username},${u.email || ""},${u.role || "USER"},${u.emailVerified !== false}`).join("\n");
        filename = "users_export.csv";
    } else if (type === "logs") {
        const logs = JSON.parse(localStorage.getItem("bmf_diary") || "[]");
        const oldLogs = JSON.parse(localStorage.getItem("bmf_movie_logs") || "[]");
        const allLogs = [...logs, ...oldLogs];

        csv = "ID,Title,Rating,WatchedAt,UserId\n";
        csv += allLogs.map((l) => `${l.id || l.movieId},"${l.title || ""}",${l.rating || 0},${l.watchedAt || l.createdAt || ""},${l.userId}`).join("\n");
        filename = "logs_export.csv";
    }

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    alert(`${type} data exported!`);
}

// ========== MODAL ==========
function openUserModal(userId) {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const user = users.find((u) => u.id === userId);

    if (!user) return;

    document.getElementById("modalTitle").textContent = `Edit User: ${user.username}`;
    document.getElementById("modalContent").innerHTML = `
    <div class="setting-item">
      <label>Block/Unblock</label>
      <button class="btn ${user.bio?.startsWith("[BLOCKED]") ? "primary" : "danger"}" onclick="toggleBlock('${userId}')">
        ${user.bio?.startsWith("[BLOCKED]") ? "Unblock" : "Block"}
      </button>
    </div>
    <div class="setting-item">
      <label>Reset Password</label>
      <button class="btn warning" onclick="resetPassword('${userId}')">Reset</button>
    </div>
    <div class="setting-item">
      <label>Role</label>
      <select id="userRoleSelect" onchange="changeRole('${userId}', this.value)">
        <option value="USER" ${user.role !== "ADMIN" ? "selected" : ""}>USER</option>
        <option value="ADMIN" ${user.role === "ADMIN" ? "selected" : ""}>ADMIN</option>
      </select>
    </div>
    <button class="btn outline" onclick="closeModal()" style="margin-top: 20px;">Close</button>
  `;

    document.getElementById("modalOverlay").classList.add("show");
    document.getElementById("userModal").classList.add("show");
}

function closeModal() {
    document.getElementById("modalOverlay").classList.remove("show");
    document.getElementById("userModal").classList.remove("show");
}

function toggleBlock(userId) {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
        if (users[userIndex].bio?.startsWith("[BLOCKED]")) {
            users[userIndex].bio = users[userIndex].bio.replace("[BLOCKED] ", "");
        } else {
            users[userIndex].bio = "[BLOCKED] " + (users[userIndex].bio || "");
        }
        localStorage.setItem("bmf_users", JSON.stringify(users));
        closeModal();
        loadUsers();
        alert("User status updated!");
    }
}

function resetPassword(userId) {
    const newPass = "Reset@" + Math.floor(Math.random() * 10000);
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
        users[userIndex].password = newPass; // Note: In production, this should be hashed
        localStorage.setItem("bmf_users", JSON.stringify(users));
        alert(`Password reset to: ${newPass}`);
        closeModal();
    }
}

function changeRole(userId, role) {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
        users[userIndex].role = role;
        localStorage.setItem("bmf_users", JSON.stringify(users));
        loadUsers();
        alert(`Role changed to ${role}!`);
    }
}

// Logout
function logout() {
    localStorage.removeItem("bmf_logged");
    localStorage.removeItem("bmf_token");
    localStorage.removeItem("bmf_user");
    localStorage.removeItem("bmf_role");
    window.location.href = "login.html";
}

// Go Back navigation
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = "home.html";
    }
}
