/* ======================================
   DASHBOARD – BACKEND INTEGRATED
   Developed by Satheesh Kumar
====================================== */

let allUserLogs = [];

document.addEventListener("DOMContentLoaded", async () => {
    const logged = localStorage.getItem("bmf_logged") === "true";
    if (!logged) {
        alert("Please login to access your dashboard!");
        window.location.href = "login.html";
        return;
    }

    // Wait for backend health check to complete before loading
    await ensureBackendChecked();
    await loadDashboard();
});

// Wait until USE_BACKEND is definitively set
async function ensureBackendChecked() {
    // If backend check already ran, USE_BACKEND is set
    if (typeof USE_BACKEND !== 'undefined') {
        // But the async IIFE might still be running —
        // do our own quick check to be sure
        try {
            const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
            USE_BACKEND = res.ok;
        } catch {
            USE_BACKEND = false;
        }
    }
}

async function loadDashboard() {
    await loadUserProfile();
    await loadDiary();
    await loadStats();
    await loadWatchlist();
    await loadFavourites();
}

// Load user profile info
async function loadUserProfile() {
    let user = null;

    if (USE_BACKEND) {
        try {
            const result = await apiRequest("/user/profile");
            if (result.success) user = result.data;
        } catch (e) {
            console.log("Backend unavailable, using localStorage");
        }
    }

    if (!user) {
        const username = localStorage.getItem("bmf_user") || "User";
        const email = localStorage.getItem("bmf_email") || "";
        const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
        const userId = localStorage.getItem("bmf_user_id");
        const storedUser = users.find(u => u.id === userId);
        user = { username, email, bio: storedUser?.bio || "" };
    }

    const container = document.getElementById("profileSection");
    if (!container) return;

    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-avatar-large">
                <span>${user.username?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div class="profile-details">
                <h2>${user.username}</h2>
                <p class="profile-email">${user.email}</p>
                <p class="profile-bio">${user.bio || "No bio yet. Add one in Edit Profile!"}</p>
                <a href="edit-profile.html" class="btn secondary">✏️ Edit Profile</a>
            </div>
        </div>
    `;
}

// ==================== DIARY (MOVIE LOGS) ====================

async function loadDiary() {
    let userLogs = [];
    const userId = localStorage.getItem("bmf_user_id");

    // Try backend first
    if (USE_BACKEND) {
        try {
            const result = await apiRequest("/logs");
            if (result.success && Array.isArray(result.data)) {
                userLogs = result.data;
            }
        } catch (e) {
            console.log("Backend unavailable for diary, using localStorage");
        }
    }

    // Fallback to localStorage
    if (userLogs.length === 0) {
        const diary = JSON.parse(localStorage.getItem("bmf_diary") || "[]");
        const oldLogs = JSON.parse(localStorage.getItem("bmf_movie_logs") || "[]");
        const allLogs = [...diary, ...oldLogs];
        if (userId) {
            userLogs = allLogs.filter(log => log.userId === userId || log.username === localStorage.getItem("bmf_user"));
        }
    }

    // Deduplicate
    const seen = new Set();
    userLogs = userLogs.filter(log => {
        const key = `${log.tmdbId || log.id || log.movieId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Sort newest first
    userLogs.sort((a, b) => new Date(b.watchedAt || b.createdAt) - new Date(a.watchedAt || a.createdAt));

    allUserLogs = userLogs;

    const container = document.getElementById("diarySection");
    if (!container) return;

    if (userLogs.length === 0) {
        container.innerHTML = `
            <h2>📓 My Diary</h2>
            <div class="empty-state">
                <span>🎬</span>
                <p>Your movie diary is empty!</p>
                <a href="log-movie.html" class="btn primary">Log Your First Movie</a>
            </div>
        `;
        return;
    }

    // Group logs by month/year
    const grouped = groupLogsByMonth(userLogs);

    // Build the month-grouped diary
    let diaryHTML = `
        <div class="diary-header">
            <h2>📓 My Diary <span class="diary-count">${userLogs.length} entries</span></h2>
            <div class="diary-search-wrapper">
                <input type="text" id="diarySearchInput" placeholder="🔍 Search logged movies..."
                    onkeyup="searchDiary()" class="diary-search-input" />
            </div>
        </div>
        <div id="diaryContent">
    `;

    for (const [monthKey, logs] of Object.entries(grouped)) {
        diaryHTML += createMonthSection(monthKey, logs);
    }

    diaryHTML += `</div>`;
    container.innerHTML = diaryHTML;
}

// Group logs by "Month Year" e.g. "February 2026"
function groupLogsByMonth(logs) {
    const grouped = {};
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    logs.forEach(log => {
        const date = new Date(log.watchedAt || log.createdAt);
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(log);
    });

    return grouped;
}

// Create a month section with date-grouped entries
function createMonthSection(monthKey, logs) {
    // Sub-group by day within the month
    const dayGroups = {};
    logs.forEach(log => {
        const date = new Date(log.watchedAt || log.createdAt);
        const dayKey = date.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
        dayGroups[dayKey].push(log);
    });

    let html = `
        <div class="diary-month-section">
            <div class="month-header">
                <span class="month-icon">📅</span>
                <h3>${monthKey}</h3>
                <span class="month-count">${logs.length} ${logs.length === 1 ? 'film' : 'films'}</span>
            </div>
            <div class="month-entries">
    `;

    for (const [dayKey, dayLogs] of Object.entries(dayGroups)) {
        html += `
            <div class="day-group">
                <div class="day-header">
                    <span class="day-dot"></span>
                    <span class="day-label">${dayKey}</span>
                </div>
                <div class="day-cards">
                    ${dayLogs.map(log => createDiaryCard(log)).join("")}
                </div>
            </div>
        `;
    }

    html += `</div></div>`;
    return html;
}

// Create diary card
function createDiaryCard(log) {
    const watchedAt = log.watchedAt || log.createdAt;
    const watchedDate = new Date(watchedAt);

    const timeStr = watchedDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const ratingEmojis = ["😡", "😕", "😐", "🙂", "😄", "🔥", "💥", "🤯", "👑", "🐺"];
    const emoji = ratingEmojis[(log.rating || 1) - 1] || "";
    const poster = log.posterPath || log.poster;
    const mediaType = log.mediaType || log.type || "movie";
    const language = log.languageWatched || log.language || "";
    const review = log.review || "";

    // Rating stars visual
    const ratingValue = log.rating || 0;
    const starsHtml = ratingValue > 0
        ? `<span class="card-rating">${emoji} <strong>${ratingValue}</strong>/10</span>`
        : `<span class="card-rating no-rating">Not rated</span>`;

    return `
        <div class="diary-card-v2" onclick="goToDetails(${log.tmdbId || log.movieId}, '${mediaType}')">
            <div class="card-poster">
                ${poster
            ? `<img src="${poster}" alt="${log.title}" loading="lazy" />`
            : `<div class="no-poster">🎬</div>`
        }
            </div>
            <div class="card-body">
                <h4 class="card-title">${log.title || "Unknown"}</h4>
                <div class="card-meta">
                    <span class="card-time">🕐 ${timeStr}</span>
                    ${language ? `<span class="card-lang">🌍 ${language}</span>` : ""}
                </div>
                ${starsHtml}
                ${review ? `
                    <div class="card-review">
                        <span class="review-icon">💬</span>
                        <p>"${review.length > 120 ? review.substring(0, 120) + '...' : review}"</p>
                    </div>
                ` : ""}
            </div>
        </div>
    `;
}

// Search diary by movie title
function searchDiary() {
    const searchTerm = document.getElementById('diarySearchInput')?.value?.toLowerCase().trim() || '';
    const contentDiv = document.getElementById('diaryContent');
    if (!contentDiv) return;

    if (!searchTerm) {
        // Show all
        const grouped = groupLogsByMonth(allUserLogs);
        let html = '';
        for (const [monthKey, logs] of Object.entries(grouped)) {
            html += createMonthSection(monthKey, logs);
        }
        contentDiv.innerHTML = html;
        return;
    }

    const filtered = allUserLogs.filter(log =>
        (log.title || '').toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        contentDiv.innerHTML = '<div class="empty-state"><span>🔍</span><p>No logs found matching your search.</p></div>';
        return;
    }

    const grouped = groupLogsByMonth(filtered);
    let html = '';
    for (const [monthKey, logs] of Object.entries(grouped)) {
        html += createMonthSection(monthKey, logs);
    }
    contentDiv.innerHTML = html;
}

// ==================== STATS ====================

async function loadStats() {
    let userLogs = allUserLogs;
    let profileData = null;
    const userId = localStorage.getItem("bmf_user_id");

    if (USE_BACKEND && userLogs.length === 0) {
        try {
            const logsResult = await apiRequest("/logs");
            if (logsResult.success) userLogs = logsResult.data;
        } catch (e) {
            console.log("Backend unavailable for stats");
        }
    }

    if (USE_BACKEND) {
        try {
            const profileResult = await apiRequest("/user/profile");
            if (profileResult.success) profileData = profileResult.data;
        } catch (e) {
            console.log("Backend unavailable for profile stats");
        }
    }

    // Get user logs from localStorage if still empty
    if (userLogs.length === 0) {
        const logs = JSON.parse(localStorage.getItem("bmf_movie_logs") || "[]");
        const diary = JSON.parse(localStorage.getItem("bmf_diary") || "[]");
        userLogs = [...logs, ...diary].filter(l => l.userId === userId);
    }

    let followers = 0;
    let following = 0;

    if (!profileData) {
        const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
        const currentUser = users.find(u => u.id === userId);
        followers = users.filter(u => {
            if (!u.following) return false;
            const followingList = typeof u.following === 'string' ? u.following.split(',') : u.following;
            return followingList.includes(userId);
        }).length;
        if (currentUser && currentUser.following) {
            const followingList = typeof currentUser.following === 'string'
                ? currentUser.following.split(',').filter(id => id.trim() !== '')
                : currentUser.following;
            following = followingList.length;
        }
    } else {
        followers = profileData.followersCount || 0;
        following = profileData.followingCount || 0;
    }

    const container = document.getElementById("statsSection");
    if (!container) return;

    const totalWatched = userLogs.length;
    const avgRating = totalWatched > 0
        ? (userLogs.reduce((sum, l) => sum + (l.rating || 0), 0) / totalWatched).toFixed(1)
        : 0;

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-icon">🎬</span>
                <span class="stat-number">${totalWatched}</span>
                <span class="stat-label">Watched</span>
            </div>
            <div class="stat-card">
                <span class="stat-icon">⭐</span>
                <span class="stat-number">${avgRating}</span>
                <span class="stat-label">Avg Rating</span>
            </div>
            <div class="stat-card">
                <span class="stat-icon">👥</span>
                <span class="stat-number">${followers}</span>
                <span class="stat-label">Followers</span>
            </div>
            <div class="stat-card">
                <span class="stat-icon">👤</span>
                <span class="stat-number">${following}</span>
                <span class="stat-label">Following</span>
            </div>
        </div>
    `;
}

// ==================== WATCHLIST ====================

async function loadWatchlist() {
    const userId = localStorage.getItem("bmf_user_id");
    let watchlist = [];

    if (USE_BACKEND) {
        try {
            const result = await apiRequest("/media/watchlist");
            if (result.success && Array.isArray(result.data)) {
                watchlist = result.data.map(item => ({
                    id: item.tmdbId,
                    userId: userId,
                    type: item.mediaType || 'movie',
                    title: item.title,
                    poster: item.posterPath,
                    addedAt: item.addedAt
                }));
            }
        } catch (e) {
            console.log("Backend unavailable for watchlist");
        }
    }

    if (watchlist.length === 0) {
        const allWatchlist = JSON.parse(localStorage.getItem("bmf_watchlist") || "[]");
        watchlist = allWatchlist.filter(m => m.userId === userId);
    }

    const container = document.getElementById("watchlistSection");
    if (!container) return;

    if (watchlist.length === 0) {
        container.innerHTML = `
            <h2>📋 Watchlist</h2>
            <div class="empty-state small">
                <p>No movies in your watchlist yet!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <h2>📋 Watchlist (${watchlist.length})</h2>
        <div class="watchlist-row">
            ${watchlist.map(m => `
                <div class="watchlist-item">
                    <img src="${m.poster || 'https://via.placeholder.com/100x150/020b2d/facc15?text=🎬'}" alt="${m.title}" onclick="goToDetails(${m.id}, '${m.type}')" />
                    <span>${m.title}</span>
                    <button class="remove-btn" onclick="removeFromWatchlist(${m.id})" title="Remove">✖</button>
                </div>
            `).join("")}
        </div>
    `;
}

// ==================== FAVOURITES ====================

async function loadFavourites() {
    const userId = localStorage.getItem("bmf_user_id");
    let favourites = [];

    if (USE_BACKEND) {
        try {
            const result = await apiRequest("/media/favorites");
            if (result.success && Array.isArray(result.data)) {
                favourites = result.data.map(item => ({
                    id: item.tmdbId,
                    userId: userId,
                    type: item.mediaType || 'movie',
                    title: item.title,
                    poster: item.posterPath,
                    addedAt: item.addedAt
                }));
            }
        } catch (e) {
            console.log("Backend unavailable for favourites");
        }
    }

    if (favourites.length === 0) {
        const allFavorites = JSON.parse(localStorage.getItem("bmf_favorites") || "[]");
        favourites = allFavorites.filter(m => m.userId === userId);
    }

    const container = document.getElementById("favouritesSection");
    if (!container) return;

    if (favourites.length === 0) {
        container.innerHTML = `
            <h2>❤️ Favourites</h2>
            <div class="empty-state small">
                <p>No favourite movies yet!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <h2>❤️ Favourites (${favourites.length})</h2>
        <div class="favourites-row">
            ${favourites.map(m => `
                <div class="favourite-item">
                    <img src="${m.poster}" alt="${m.title}" onclick="goToDetails(${m.id}, '${m.type}')" />
                    <button class="remove-btn" onclick="removeFromFavorites(${m.id})" title="Remove">✖</button>
                </div>
            `).join("")}
        </div>
    `;
}

// ==================== REMOVE ACTIONS ====================

function removeFromWatchlist(id) {
    const userId = localStorage.getItem("bmf_user_id");
    let watchlist = JSON.parse(localStorage.getItem("bmf_watchlist") || "[]");
    watchlist = watchlist.filter(m => !(m.id == id && m.userId === userId));
    localStorage.setItem("bmf_watchlist", JSON.stringify(watchlist));

    if (USE_BACKEND) {
        mediaApiCall(`/watchlist/${id}`, 'DELETE');
    }
    loadWatchlist();
}

function removeFromFavorites(id) {
    const userId = localStorage.getItem("bmf_user_id");
    let favorites = JSON.parse(localStorage.getItem("bmf_favorites") || "[]");
    const item = favorites.find(m => m.id == id && m.userId === userId);
    const mediaType = item?.type || 'movie';
    favorites = favorites.filter(m => !(m.id == id && m.userId === userId));
    localStorage.setItem("bmf_favorites", JSON.stringify(favorites));

    if (USE_BACKEND) {
        mediaApiCall(`/favorites/${id}?mediaType=${mediaType}`, 'DELETE');
    }
    loadFavourites();
}

// Navigate to details
function goToDetails(id, type) {
    window.location.href = `movie-details.html?id=${id}&type=${type}`;
}
