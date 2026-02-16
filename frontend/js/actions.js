/* ======================================
   SHARED ACTIONS – WATCHLIST & FAVORITES
   Developed by Satheesh Kumar
====================================== */

/**
 * Sync helper – calls backend API with auth token
 */
async function mediaApiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem("bmf_token");
    if (!token) return null;

    const baseUrl = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:8080/api';
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(`${baseUrl}/media${endpoint}`, options);
        if (res.ok) {
            const text = await res.text();
            return text ? JSON.parse(text) : null;
        }
        console.warn("Media API error:", res.status);
        return null;
    } catch (e) {
        console.warn("Media API unreachable, using localStorage only:", e.message);
        return null;
    }
}

/**
 * Toggle Watchlist status for a movie/series
 * @param {string|number} id - TMDB ID
 * @param {string} type - 'movie' or 'tv'
 * @param {string} title - Title/Name
 * @param {string} poster - Poster Path (full URL)
 * @param {HTMLElement} btnElement - (Optional) Button element to update visually
 */
async function toggleWatchlist(id, type, title, poster, btnElement = null) {
    const userId = localStorage.getItem("bmf_user_id");

    if (!userId) {
        alert("Please login to use this feature! 🔒");
        return;
    }

    let watchlist = JSON.parse(localStorage.getItem("bmf_watchlist") || "[]");
    const index = watchlist.findIndex(m => m.id == id && m.userId === userId);

    if (index === -1) {
        // Add
        watchlist.push({
            id: id,
            userId: userId,
            type: type,
            title: title,
            poster: poster,
            addedAt: new Date().toISOString()
        });
        showToast(`Added ${title} to Watchlist! 📝`);
        if (btnElement) updateBtnState(btnElement, true, "watchlist");

        // Sync to backend
        mediaApiCall('/watchlist', 'POST', {
            tmdbId: Number(id),
            mediaType: type || 'movie',
            title: title,
            posterPath: poster
        });
    } else {
        // Remove
        watchlist.splice(index, 1);
        showToast(`Removed ${title} from Watchlist.`);
        if (btnElement) updateBtnState(btnElement, false, "watchlist");

        // Sync to backend
        mediaApiCall(`/watchlist/${id}`, 'DELETE');
    }

    localStorage.setItem("bmf_watchlist", JSON.stringify(watchlist));

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: { id, userId } }));
}

/**
 * Toggle Favorite status for a movie/series
 * @param {string|number} id - TMDB ID
 * @param {string} type - 'movie' or 'tv'
 * @param {string} title - Title/Name
 * @param {string} poster - Poster Path (full URL)
 * @param {HTMLElement} btnElement - (Optional) Button element to update visually
 */
async function toggleFavorite(id, type, title, poster, btnElement = null) {
    const userId = localStorage.getItem("bmf_user_id");

    if (!userId) {
        alert("Please login to use this feature! 🔒");
        return;
    }

    let favorites = JSON.parse(localStorage.getItem("bmf_favorites") || "[]");
    const index = favorites.findIndex(m => m.id == id && m.userId === userId);

    if (index === -1) {
        // Add
        favorites.push({
            id: id,
            userId: userId,
            type: type,
            title: title,
            poster: poster,
            addedAt: new Date().toISOString()
        });
        showToast(`Added ${title} to Favorites! ❤️`);
        if (btnElement) updateBtnState(btnElement, true, "favorite");

        // Sync to backend
        mediaApiCall('/favorites', 'POST', {
            tmdbId: Number(id),
            mediaType: type || 'movie',
            title: title,
            posterPath: poster
        });
    } else {
        // Remove
        favorites.splice(index, 1);
        showToast(`Removed ${title} from Favorites.`);
        if (btnElement) updateBtnState(btnElement, false, "favorite");

        // Sync to backend
        mediaApiCall(`/favorites/${id}?mediaType=${type || 'movie'}`, 'DELETE');
    }

    localStorage.setItem("bmf_favorites", JSON.stringify(favorites));

    // Dispatch event
    window.dispatchEvent(new CustomEvent('favorites-updated', { detail: { id, userId } }));
}

/**
 * Check if item is in list
 */
function isInList(listType, id) {
    const userId = localStorage.getItem("bmf_user_id");
    if (!userId) return false;

    const list = JSON.parse(localStorage.getItem(`bmf_${listType}`) || "[]");
    return list.some(m => m.id == id && m.userId === userId);
}

// Helper to update button visual state
function updateBtnState(btn, isActive, type) {
    if (!btn) return;

    if (type === "watchlist") {
        btn.innerHTML = isActive ? "✅ In Watchlist" : "🔖 Watchlist";
        btn.classList.toggle("active", isActive);
    } else if (type === "favorite") {
        btn.innerHTML = isActive ? "❤️ Favorited" : "🤍 Favorite";
        btn.classList.toggle("active", isActive);
        // Special handling for icon-only buttons
        if (btn.classList.contains("icon-btn")) {
            btn.innerHTML = isActive ? "❤️" : "🤍";
        }
    }
}

// Simple Toast Notification
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;
    document.body.appendChild(toast);

    // Initial styles
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(2, 6, 23, 0.9)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        border: '1px solid #22d3ee',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease-out'
    });

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 290);
    }, 3000);
}

// Add styles dynamically
const style = document.createElement('style');
style.innerHTML = `
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);
