/* ======================================
   HEADER FUNCTIONALITY
   Developed by Satheesh Kumar
====================================== */

// Initialize header
function initHeader() {
    const logged = localStorage.getItem("bmf_logged") === "true";
    const username = localStorage.getItem("bmf_user") || "G";
    const role = localStorage.getItem("bmf_role");

    // Hide auth-only links for guests
    document.querySelectorAll(".auth-only").forEach(el => {
        if (!logged) el.style.display = "none";
    });

    // Show admin link only for ADMIN users
    const adminLink = document.getElementById("adminNavLink");
    if (adminLink && logged && role === "ADMIN") {
        adminLink.style.display = "inline-flex";
    }

    // Set avatar
    const avatarInitial = document.getElementById("avatarInitial");
    const profilePic = localStorage.getItem("bmf_profile_picture");

    if (avatarInitial) {
        if (profilePic && profilePic.startsWith("data:image")) {
            // Create image element if not exists or replace text
            avatarInitial.innerHTML = `<img src="${profilePic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            // Ensure parent has no padding/background if needed, but usually covering it is fine
        } else {
            avatarInitial.textContent = username.charAt(0).toUpperCase();
        }
    }

    // Setup search functionality
    setupSearch();
}

// Setup global search functionality
function setupSearch() {
    const searchInput = document.getElementById("globalSearch");
    const searchResults = document.getElementById("searchResults");
    const searchClear = document.getElementById("searchClear");
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            if (searchClear) searchClear.style.display = query ? "block" : "none";

            clearTimeout(searchTimeout);
            if (query.length < 2) {
                if (searchResults) {
                    searchResults.innerHTML = "";
                    searchResults.classList.remove("show");
                }
                return;
            }

            searchTimeout = setTimeout(() => performSearch(query), 300);
        });

        searchInput.addEventListener("focus", () => {
            if (searchInput.value.trim().length >= 2 && searchResults) {
                searchResults.classList.add("show");
            }
        });

        // Handle Enter key
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    performSearch(query);
                }
            }
        });
    }

    if (searchClear) {
        searchClear.addEventListener("click", () => {
            searchInput.value = "";
            searchResults.innerHTML = "";
            searchResults.classList.remove("show");
            searchClear.style.display = "none";
        });
    }

    // Close search on outside click
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-wrapper")) {
            searchResults?.classList.remove("show");
        }
    });
}

// Perform TMDB search
async function performSearch(query) {
    const searchResults = document.getElementById("searchResults");
    if (!searchResults) return;

    // Show loading
    searchResults.innerHTML = `<div class="search-loading">Searching...</div>`;
    searchResults.classList.add("show");

    try {
        // Search movies
        const movieRes = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
        const movieData = await movieRes.json();

        // Search TV
        const tvRes = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
        const tvData = await tvRes.json();

        // Search Person
        const personRes = await fetch(`${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
        const personData = await personRes.json();

        // Search Users (Local or Backend)
        const usersRes = await searchUsers(query);

        // Combine results
        const movies = movieData.results?.slice(0, 4) || [];
        const tvShows = tvData.results?.slice(0, 3) || [];
        const people = personData.results?.slice(0, 2) || [];
        const users = usersRes.slice(0, 3);

        let html = "";

        // Users Section
        if (users.length > 0) {
            html += `<div class="search-category"><span>👥 Users</span></div>`;
            users.forEach(u => {
                const isFollowing = checkFollowing(u.id);
                html += `
                    <div class="search-item user">
                        <div class="user-avatar-small">${u.username.charAt(0).toUpperCase()}</div>
                        <div class="search-item-info">
                            <span class="title">${escapeHtml(u.username)}</span>
                            <span class="year">User</span>
                        </div>
                        ${localStorage.getItem("bmf_logged") === "true" && u.id !== localStorage.getItem("bmf_user_id") ?
                        `<button class="btn-action ${isFollowing ? 'following' : ''}" onclick="event.stopPropagation(); toggleFollow('${u.id}')">${isFollowing ? 'Following' : 'Follow'}</button>`
                        : ""}
                    </div>
                `;
            });
        }

        if (movies.length > 0) {
            html += `<div class="search-category"><span>🎬 Movies</span></div>`;
            movies.forEach(m => {
                const poster = m.poster_path ? `${TMDB_IMG_W185}${m.poster_path}` : "";
                const year = m.release_date?.split("-")[0] || "";
                const rating = m.vote_average?.toFixed(1) || "";
                html += `
                    <div class="search-item" onclick="goToDetails(${m.id}, 'movie')">
                        ${poster ? `<img src="${poster}" alt="${escapeHtml(m.title)}" />` : `<div class="no-poster">🎬</div>`}
                        <div class="search-item-info">
                            <span class="title">${escapeHtml(m.title)}</span>
                            <span class="year">${year} ${rating ? `• ⭐ ${rating}` : ""}</span>
                        </div>
                        ${localStorage.getItem("bmf_logged") === "true" ? `<button class="quick-log" onclick="event.stopPropagation(); quickLog(${m.id}, 'movie', '${escapeHtml(m.title)}')">✍️</button>` : ""}
                    </div>
                `;
            });
        }

        if (tvShows.length > 0) {
            html += `<div class="search-category"><span>📺 TV Series</span></div>`;
            tvShows.forEach(t => {
                const poster = t.poster_path ? `${TMDB_IMG_W185}${t.poster_path}` : "";
                const year = t.first_air_date?.split("-")[0] || "";
                const rating = t.vote_average?.toFixed(1) || "";
                html += `
                    <div class="search-item" onclick="goToDetails(${t.id}, 'tv')">
                        ${poster ? `<img src="${poster}" alt="${escapeHtml(t.name)}" />` : `<div class="no-poster">📺</div>`}
                        <div class="search-item-info">
                            <span class="title">${escapeHtml(t.name)}</span>
                            <span class="year">${year} ${rating ? `• ⭐ ${rating}` : ""}</span>
                        </div>
                        ${localStorage.getItem("bmf_logged") === "true" ? `<button class="quick-log" onclick="event.stopPropagation(); quickLog(${t.id}, 'tv', '${escapeHtml(t.name)}')">✍️</button>` : ""}
                    </div>
                `;
            });
        }

        if (people.length > 0) {
            html += `<div class="search-category"><span>👤 People</span></div>`;
            people.forEach(p => {
                const photo = p.profile_path ? `${TMDB_IMG_W185}${p.profile_path}` : "";
                const known = p.known_for?.map(k => k.title || k.name).slice(0, 2).join(", ") || p.known_for_department || "";
                html += `
                    <div class="search-item person" onclick="goToPersonDetails(${p.id}, '${escapeHtml(p.name)}')">
                        ${photo ? `<img src="${photo}" alt="${escapeHtml(p.name)}" />` : `<div class="no-poster">👤</div>`}
                        <div class="search-item-info">
                            <span class="title">${escapeHtml(p.name)}</span>
                            <span class="year">${known}</span>
                        </div>
                    </div>
                `;
            });
        }

        if (!html) {
            html = `<div class="no-results">No results found for "${escapeHtml(query)}"</div>`;
        }

        searchResults.innerHTML = html;
        searchResults.classList.add("show");
    } catch (err) {
        console.error("Search error:", err);
        searchResults.innerHTML = `<div class="no-results">Search failed. Note: User search might be unavailable.</div>`;
        searchResults.classList.add("show");
    }
}

// Search users helper
async function searchUsers(query) {
    // Determine if using backend or local
    const useBackend = typeof USE_BACKEND !== 'undefined' && USE_BACKEND;

    if (useBackend) {
        try {
            const result = await apiRequest(`/user/search?query=${encodeURIComponent(query)}`);
            if (result.success) {
                return result.data || [];
            }
            return [];
        } catch (e) {
            console.error("Backend user search failed:", e);
            return [];
        }
    }

    // Local Storage Search
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    return users.filter(u => u.username.toLowerCase().includes(query.toLowerCase()));
}

function checkFollowing(targetId) {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const currentId = localStorage.getItem("bmf_user_id");
    if (!currentId) return false;

    const currentUser = users.find(u => u.id === currentId);
    return currentUser?.following?.includes(targetId);
}

function toggleFollow(targetId) {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const currentId = localStorage.getItem("bmf_user_id");

    const userIndex = users.findIndex(u => u.id === currentId);
    if (userIndex === -1) return;

    let following = users[userIndex].following ? users[userIndex].following.split(',') : [];

    if (following.includes(targetId)) {
        following = following.filter(id => id !== targetId);
    } else {
        following.push(targetId);
    }

    users[userIndex].following = following.join(',');
    localStorage.setItem("bmf_users", JSON.stringify(users));

    // Re-render search to update button state? Or just toggle class
    const btn = event.target;
    if (btn) {
        btn.textContent = following.includes(targetId) ? 'Following' : 'Follow';
        btn.classList.toggle('following');
    }
}

// Navigate to movie/tv details
function goToDetails(id, type) {
    window.location.href = `movie-details.html?id=${id}&type=${type}`;
}

// Navigate to person details
function goToPersonDetails(id, name) {
    window.location.href = `movie-details.html?actor=${id}&name=${encodeURIComponent(name)}`;
}

// Quick log from search
function quickLog(id, type, title) {
    window.location.href = `log-movie.html?id=${id}&type=${type}&title=${encodeURIComponent(title)}`;
}

// Escape HTML for safe rendering
function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Toggle profile panel
function toggleProfilePanel() {
    const panel = document.getElementById("profilePanel");
    const overlay = document.querySelector(".profile-overlay");
    if (panel) {
        panel.classList.toggle("open");
        overlay?.classList.toggle("show");
    }
}

// Go Back navigation
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = "home.html";
    }
}
