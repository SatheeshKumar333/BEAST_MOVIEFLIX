/* ======================================
   EDIT PROFILE – BACKEND INTEGRATED
   Developed by Satheesh Kumar
====================================== */

document.addEventListener("DOMContentLoaded", async () => {
    // Direct check to avoid race conditions with config.js async init
    const logged = localStorage.getItem("bmf_logged") === "true";
    if (!logged) {
        alert("Please login to edit your profile!");
        window.location.href = "login.html";
        return;
    }

    await loadCurrentProfile();
    setupBioCounter();
    setupProfilePicture();
    setupFavoritesSearch();
});

let selectedFavorites = [];

async function loadCurrentProfile() {
    let user;

    if (USE_BACKEND) {
        const result = await apiRequest("/user/profile");
        if (result.success) {
            user = result.data;
        }
    }

    if (!user) {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
        const userId = localStorage.getItem("bmf_user_id");
        user = users.find(u => u.id === userId) || {
            username: localStorage.getItem("bmf_user") || "",
            email: localStorage.getItem("bmf_email") || "",
            bio: ""
        };

        // Load favorites from local user object
        if (user.favourites) {
            try {
                selectedFavorites = JSON.parse(user.favourites);
            } catch (e) { selectedFavorites = []; }
        } else {
            // Try global Favorites list as fallback
            const allFavs = JSON.parse(localStorage.getItem("bmf_favorites") || "[]");
            selectedFavorites = allFavs.filter(f => f.userId === userId).slice(0, 4);
        }
    } else {
        // Backend user favorites (if available in profile response)
        // For now, let's assume backend returns "favourites" as a JSON string or list
        if (user.favourites) {
            try {
                selectedFavorites = typeof user.favourites === 'string' ? JSON.parse(user.favourites) : user.favourites;
            } catch (e) { selectedFavorites = []; }
        }
    }

    // Populate form
    document.getElementById("usernameInput").value = user.username || "";
    document.getElementById("emailInput").value = user.email || "";
    document.getElementById("bioInput").value = user.bio || "";

    // Update avatar
    const avatarLetter = document.getElementById("avatarLetter");
    if (avatarLetter) {
        avatarLetter.textContent = user.username?.charAt(0)?.toUpperCase() || "U";
    }

    // Update bio counter
    updateBioCounter();

    // Render Favorites
    renderSelectedFavorites();
}

function setupFavoritesSearch() {
    const input = document.getElementById("favMovieSearch");
    const results = document.getElementById("favSearchResults");

    if (!input || !results) return;

    let timeout = null;

    input.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        clearTimeout(timeout);

        if (query.length < 2) {
            results.style.display = "none";
            return;
        }

        timeout = setTimeout(async () => {
            const data = await fetchTMDB(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);

            if (data.results && data.results.length > 0) {
                const items = data.results.filter(i => i.media_type === 'movie' || i.media_type === 'tv').slice(0, 5);

                results.innerHTML = items.map(item => {
                    const year = (item.release_date || item.first_air_date || "").split("-")[0];
                    const title = item.title || item.name;
                    const img = item.poster_path ? `${TMDB_IMG_W185}${item.poster_path}` : "https://via.placeholder.com/45x68";

                    return `
                        <div class="dropdown-item" onclick="addFavorite('${item.id}', '${item.media_type}', '${escapeHtml(title)}', '${img}')">
                            <img src="${img}" width="30" style="margin-right:10px; border-radius:4px;">
                            <div>
                                <div class="title">${title}</div>
                                <div class="subtitle">${item.media_type.toUpperCase()} • ${year}</div>
                            </div>
                        </div>
                     `;
                }).join("");
                results.style.display = "block";
            } else {
                results.style.display = "none";
            }
        }, 300);
    });

    // Hide results when clicking outside
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.style.display = "none";
        }
    });
}

function addFavorite(id, type, title, poster) {
    if (selectedFavorites.length >= 4) {
        alert("You can only select up to 4 favorites!");
        return;
    }

    if (selectedFavorites.some(f => f.id == id)) {
        alert("Already in your favorites!");
        return;
    }

    selectedFavorites.push({ id, type, title, poster });
    renderSelectedFavorites();

    document.getElementById("favMovieSearch").value = "";
    document.getElementById("favSearchResults").style.display = "none";
}

function removeFavorite(id) {
    selectedFavorites = selectedFavorites.filter(f => f.id != id);
    renderSelectedFavorites();
}

function renderSelectedFavorites() {
    const container = document.getElementById("selectedFavorites");
    if (!container) return;

    container.innerHTML = selectedFavorites.map(f => `
        <div class="fav-item">
            <img src="${f.poster}" alt="${f.title}" />
            <button type="button" class="remove-btn" onclick="removeFavorite('${f.id}')">❌</button>
        </div>
    `).join("");
}

// Helper fetch (if not globally available, though config.js might not have it exposed as such, usually home.js has it)
// We'll reuse apiRequest or fetch directly since config.js has secrets
async function fetchTMDB(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("TMDB Fetch Error:", err);
        return { results: [] };
    }
}

// Utility to escape HTML
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function setupBioCounter() {
    const bioInput = document.getElementById("bioInput");
    if (bioInput) {
        bioInput.addEventListener("input", updateBioCounter);
    }
}

function updateBioCounter() {
    const bioInput = document.getElementById("bioInput");
    const counter = document.getElementById("bioCharCount");
    if (bioInput && counter) {
        counter.textContent = bioInput.value.length;
    }
}

function setupProfilePicture() {
    const picInput = document.getElementById("profilePicInput");
    if (picInput) {
        picInput.addEventListener("change", handleProfilePicChange);
    }
}

function handleProfilePicChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
        alert("Please select an image file!");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Image must be less than 2MB!");
        return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
        const avatarPreview = document.getElementById("avatarPreview");
        const avatarLetter = document.getElementById("avatarLetter");

        // Store Base64 for submission
        profilePictureBase64 = event.target.result;

        if (avatarPreview) {
            avatarPreview.style.backgroundImage = `url(${event.target.result})`;
            avatarPreview.style.backgroundSize = "cover";
            avatarPreview.style.backgroundPosition = "center";
            if (avatarLetter) avatarLetter.style.display = "none";
        }
    };
    reader.readAsDataURL(file);
}

let profilePictureBase64 = null;

async function saveProfile(event) {
    event.preventDefault();

    const username = document.getElementById("usernameInput")?.value?.trim();
    const email = document.getElementById("emailInput")?.value?.trim();
    const bio = document.getElementById("bioInput")?.value?.trim();
    const newPassword = document.getElementById("newPasswordInput")?.value;

    // Validation
    if (!username || username.length < 3) {
        showMessage("Username must be at least 3 characters!", "error");
        return false;
    }

    if (!email || !validateEmail(email)) {
        showMessage("Please enter a valid email!", "error");
        return false;
    }

    if (newPassword && newPassword.length < 6) {
        showMessage("Password must be at least 6 characters!", "error");
        return false;
    }

    const updateData = { username, email, bio };
    if (newPassword) updateData.newPassword = newPassword;

    // Add favorites to update data
    updateData.favourites = JSON.stringify(selectedFavorites);

    // Add profile picture if available (Base64)
    if (profilePictureBase64) {
        updateData.profilePicture = profilePictureBase64;
    }

    if (USE_BACKEND) {
        const result = await apiRequest("/user/profile", {
            method: "PUT",
            body: JSON.stringify(updateData)
        });

        if (result.success) {
            localStorage.setItem("bmf_user", result.data.username);
            localStorage.setItem("bmf_email", result.data.email);
            if (result.data.profilePicture) {
                localStorage.setItem("bmf_profile_picture", result.data.profilePicture);
            }
            showMessage("Profile updated successfully! 🎉", "success");
            setTimeout(() => window.location.href = "dashboard.html", 1500);
            return false;
        } else {
            showMessage(result.error || "Failed to update profile!", "error");
            return false;
        }
    }

    // Fallback to localStorage
    const saved = updateLocalProfile(updateData);
    if (saved) {
        // Also update global favorites if needed, or rely on profile data
        // For consistent behavior with home page, we might want to sync this with global favorites
        // but for now, Profile Favorites are treated as a showcase list separate from the "Heart" action
        // OR we can merge them. Let's keep them as "Showcase" favorites for now.
        showMessage("Profile updated successfully! 🎉", "success");
        setTimeout(() => window.location.href = "dashboard.html", 1500);
    } else {
        showMessage("Failed to update profile!", "error");
    }

    return false;
}

function updateLocalProfile(data) {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const userId = localStorage.getItem("bmf_user_id");
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return false;

    // Check if username is taken by another user
    if (users.some((u, i) => i !== userIndex && u.username === data.username)) {
        showMessage("Username already taken!", "error");
        return false;
    }

    // Check if email is taken by another user
    if (users.some((u, i) => i !== userIndex && u.email === data.email)) {
        showMessage("Email already registered!", "error");
        return false;
    }

    users[userIndex] = { ...users[userIndex], ...data };
    if (data.newPassword) {
        users[userIndex].password = data.newPassword;
    }

    // Update favorites specifically
    if (data.favourites) {
        users[userIndex].favourites = data.favourites;
    }

    localStorage.setItem("bmf_users", JSON.stringify(users));
    localStorage.setItem("bmf_user", data.username);
    localStorage.setItem("bmf_email", data.email);

    return true;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(text, type) {
    const existing = document.querySelector(".profile-message");
    if (existing) existing.remove();

    const container = document.querySelector(".edit-container");
    if (!container) {
        alert(text);
        return;
    }

    const msg = document.createElement("div");
    msg.className = `profile-message ${type}`;
    msg.innerHTML = `<span>${text}</span>`;
    container.prepend(msg);

    if (type !== "success") {
        setTimeout(() => msg.remove(), 4000);
    }
}
