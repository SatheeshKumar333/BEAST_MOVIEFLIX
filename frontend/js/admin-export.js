
// ========== USER DATA EXPORT FUNCTIONS ==========

// Toggle select all checkboxes
function toggleSelectAll() {
    const selectAll = document.getElementById("selectAllUsers");
    const checkboxes = document.querySelectorAll(".user-checkbox");

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });

    updateSelectedCount();
}

// Update selected count and enable/disable button
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll(".user-checkbox:checked");
    const count = checkboxes.length;

    document.getElementById("selectedCount").textContent = count;
    document.getElementById("downloadSelectedBtn").disabled = count === 0;

    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll(".user-checkbox");
    const selectAllCheckbox = document.getElementById("selectAllUsers");

    if (allCheckboxes.length > 0) {
        selectAllCheckbox.checked = count === allCheckboxes.length;
        selectAllCheckbox.indeterminate = count > 0 && count < allCheckboxes.length;
    }
}

// Get user complete data including logs
function getUserCompleteData(userId) {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const user = users.find(u => u.id === userId);

    if (!user) return null;

    // Get user's movie logs
    const diary = JSON.parse(localStorage.getItem("bmf_diary") || "[]");
    const oldLogs = JSON.parse(localStorage.getItem("bmf_movie_logs") || "[]");
    const allLogs = [...diary, ...oldLogs];
    const userLogs = allLogs.filter(log => log.userId === userId);

    // Get user's watchlist
    const watchlist = JSON.parse(localStorage.getItem("bmf_watchlist") || "[]");
    const userWatchlist = watchlist.filter(item => item.userId === userId);

    // Get user's favorites
    const favorites = JSON.parse(localStorage.getItem("bmf_favorites") || "[]");
    const userFavorites = favorites.filter(item => item.userId === userId);

    // Get user's groups
    const groups = JSON.parse(localStorage.getItem("bmf_groups") || "[]");
    const userGroups = groups.filter(g => g.members?.includes(userId) || g.creatorId === userId);

    // Calculate stats
    const avgRating = userLogs.length > 0
        ? (userLogs.reduce((sum, log) => sum + (log.rating || 0), 0) / userLogs.length).toFixed(1)
        : 0;

    return {
        profile: {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio || "",
            profilePicture: user.profilePicture || null,
            role: user.role || "USER",
            emailVerified: user.emailVerified !== false,
            createdAt: user.createdAt || null,
            lastLogin: user.lastLogin || null
        },
        movieLogs: userLogs.map(log => ({
            title: log.title,
            tmdbId: log.tmdb Id || log.movieId,
            mediaType: log.mediaType || "movie",
            rating: log.rating,
            review: log.review || "",
            languageWatched: log.languageWatched || log.language || "Not specified",
            watchedAt: log.watchedAt || log.createdAt,
            loggedAt: log.createdAt,
            posterPath: log.posterPath || log.poster
        })),
    watchlist: userWatchlist.map(item => ({
        tmdbId: item.tmdbId,
        title: item.title,
        mediaType: item.mediaType,
        addedAt: item.addedAt || item.createdAt
    })),
        favorites: userFavorites.map(item => ({
            tmdbId: item.tmdbId,
            title: item.title,
            mediaType: item.mediaType,
            addedAt: item.addedAt || item.createdAt
        })),
            groups: userGroups.map(g => ({
                id: g.id,
                name: g.name,
                memberCount: g.memberCount || g.members?.length || 0,
                role: g.creatorId === userId ? "creator" : "member"
            })),
                statistics: {
        totalMoviesLogged: userLogs.length,
            averageRating: parseFloat(avgRating),
                watchlistCount: userWatchlist.length,
                    favoritesCount: userFavorites.length,
                        groupsCount: userGroups.length
    }
};
}

// Download single user data
function downloadSingleUser(userId) {
    const userData = getUserCompleteData(userId);

    if (!userData) {
        alert("User not found!");
        return;
    }

    const format = document.querySelector('input[name="exportFormat"]:checked').value;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `bmf-user-${userData.profile.username}-${timestamp}`;

    if (format === "json") {
        const jsonData = JSON.stringify(userData, null, 2);
        triggerDownload(jsonData, `${filename}.json`, "application/json");
    } else {
        const csvData = convertToCSV([userData]);
        triggerDownload(csvData, `${filename}.csv`, "text/csv");
    }
}

// Download selected users
function downloadSelectedUsers() {
    const checkboxes = document.querySelectorAll(".user-checkbox:checked");
    const userIds = Array.from(checkboxes).map(cb => cb.dataset.userId);

    if (userIds.length === 0) {
        alert("Please select at least one user!");
        return;
    }

    const usersData = userIds.map(id => getUserCompleteData(id)).filter(data => data !== null);
    const format = document.querySelector('input[name="exportFormat"]:checked').value;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `bmf-users-export-${timestamp}`;

    const exportData = {
        exportDate: new Date().toISOString(),
        totalUsers: usersData.length,
        users: usersData
    };

    if (format === "json") {
        const jsonData = JSON.stringify(exportData, null, 2);
        triggerDownload(jsonData, `${filename}.json`, "application/json");
    } else {
        const csvData = convertToCSV(usersData);
        triggerDownload(csvData, `${filename}.csv`, "text/csv");
    }
}

// Download all users
function downloadAllUsers() {
    if (!confirm("Download data for ALL users? This may take a moment for large datasets.")) {
        return;
    }

    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const usersData = users.map(user => getUserCompleteData(user.id)).filter(data => data !== null);
    const format = document.querySelector('input[name="exportFormat"]:checked').value;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `bmf-all-users-${timestamp}`;

    const exportData = {
        exportDate: new Date().toISOString(),
        totalUsers: usersData.length,
        users: usersData
    };

    if (format === "json") {
        const jsonData = JSON.stringify(exportData, null, 2);
        triggerDownload(jsonData, `${filename}.json`, "application/json");
    } else {
        const csvData = convertToCSV(usersData);
        triggerDownload(csvData, `${filename}.csv`, "text/csv");
    }
}

// Convert data to CSV format
function convertToCSV(usersData) {
    // CSV Header
    const headers = [
        "User ID", "Username", "Email", "Role", "Email Verified",
        "Total Logs", "Avg Rating", "Watchlist Count", "Favorites Count", "Groups Count",
        "Created At", "Last Login"
    ];

    // CSV Rows
    const rows = usersData.map(userData => [
        userData.profile.id,
        userData.profile.username,
        userData.profile.email,
        userData.profile.role,
        userData.profile.emailVerified,
        userData.statistics.totalMoviesLogged,
        userData.statistics.averageRating,
        userData.statistics.watchlistCount,
        userData.statistics.favoritesCount,
        userData.statistics.groupsCount,
        userData.profile.createdAt || "N/A",
        userData.profile.lastLogin || "N/A"
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    return csvContent;
}

// Trigger file download
function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    console.log(`Downloaded: ${filename}`);
}
