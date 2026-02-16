/* =======================================
   BEAST MOVIEFLIX – CONFIGURATION
   Developed by Satheesh Kumar
======================================== */

// TMDB API Configuration
const TMDB_API_KEY = "84bbc1c699930f2c9f220c722da946b3";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_IMG_W185 = "https://image.tmdb.org/t/p/w185";
const TMDB_IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";
const TMDB_IMG_H632 = "https://image.tmdb.org/t/p/h632";

// Helper to escape HTML characters in strings (for onclick attributes etc)
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Backend API Configuration
const BACKEND_URL = "http://localhost:8080/api";

// Fallback mode flag (use localStorage when backend is unavailable)
let USE_BACKEND = true;

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("bmf_token");

    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, config);

        // Handle empty responses
        const text = await response.text();
        let data = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                data = { message: text };
            }
        }

        if (!response.ok) {
            // Handle 401/403 (Unauthorized/Forbidden) - Token likely invalid/expired
            if (response.status === 401 || response.status === 403) {
                console.warn("Session expired or invalid. Logging out...");
                // TEMPORARY DEBUGGING: Disable auto-logout to see the console error
                console.error("DEBUG: 403 Forbidden received. Request failed.");
                console.error("DEBUG: Token used:", localStorage.getItem("bmf_token"));

                /*
                localStorage.removeItem("bmf_logged");
                localStorage.removeItem("bmf_token");
                localStorage.removeItem("bmf_user_id");
                localStorage.removeItem("bmf_user");
                localStorage.removeItem("bmf_email");

                // Only redirect if not already on login page
                if (!window.location.href.includes("login.html") && !window.location.href.includes("index.html")) {
                    alert("Session expired! Please login again.");
                    window.location.href = "login.html";
                }
                */
                return { success: false, error: "Session expired (Debug Mode)" };
            }
            throw new Error(data?.message || `HTTP ${response.status}`);
        }

        return { success: true, data: data || {} };
    } catch (error) {
        console.error("API Error:", error);
        return { success: false, error: error.message };
    }
}

// Auth helpers - now supports both backend and localStorage modes
function isLoggedIn() {
    const logged = localStorage.getItem("bmf_logged") === "true";
    const hasToken = localStorage.getItem("bmf_token");
    const hasUserId = localStorage.getItem("bmf_user_id");

    // If backend mode, require token; otherwise just check logged flag
    if (USE_BACKEND) {
        return logged && hasToken;
    }
    return logged && hasUserId;
}

function getAuthToken() {
    return localStorage.getItem("bmf_token");
}

function getCurrentUserId() {
    return localStorage.getItem("bmf_user_id");
}

function getCurrentUser() {
    return {
        id: localStorage.getItem("bmf_user_id"),
        username: localStorage.getItem("bmf_user"),
        email: localStorage.getItem("bmf_email")
    };
}

// Check if backend is available
async function checkBackendHealth() {
    try {
        const res = await fetch(`${BACKEND_URL}/health`, {
            signal: AbortSignal.timeout(3000)
        });
        return res.ok;
    } catch {
        return false;
    }
}

// Initialize backend check
(async () => {
    USE_BACKEND = await checkBackendHealth();
    if (!USE_BACKEND) {
        console.warn("⚠️ Backend unavailable - using localStorage fallback mode");
    } else {
        console.log("✅ Backend connected at", BACKEND_URL);
    }
})();
