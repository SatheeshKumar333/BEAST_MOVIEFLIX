/* ======================================
   PROFILE PANEL – BACKEND INTEGRATED
   Developed by Satheesh Kumar
====================================== */

// Toggle panel
function toggleProfilePanel() {
  const panel = document.getElementById("profilePanel");
  const overlay = document.querySelector(".profile-overlay");

  if (panel) {
    panel.classList.toggle("open");
    overlay?.classList.toggle("show");
  }
}

// Initialize profile data
document.addEventListener("DOMContentLoaded", async () => {
  await loadProfileData();
});

// Load profile data
async function loadProfileData() {
  const avatarEl = document.querySelector(".avatar span, .avatar");
  const username = localStorage.getItem("bmf_user") || "Guest";

  // Update avatar initial
  if (avatarEl) {
    if (avatarEl.tagName === "SPAN") {
      avatarEl.textContent = username.charAt(0).toUpperCase();
    } else {
      avatarEl.textContent = username.charAt(0).toUpperCase();
    }
  }

  // If logged in and backend available, fetch from API
  if (isLoggedIn() && USE_BACKEND) {
    try {
      const result = await apiRequest("/user/profile");
      if (result.success) {
        updateProfileUI(result.data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }
}

// Update profile UI with data
function updateProfileUI(data) {
  // Update localStorage with fresh data
  if (data.username) localStorage.setItem("bmf_user", data.username);
  if (data.email) localStorage.setItem("bmf_email", data.email);
  if (data.profilePicture) localStorage.setItem("bmf_profile_picture", data.profilePicture);

  // Update UI elements if they exist
  const usernameEl = document.getElementById("profileUsername");
  const emailEl = document.getElementById("profileEmail");
  const initialEl = document.getElementById("profileInitial");

  // Also update the main avatar in the panel header if it exists
  const panelAvatar = document.querySelector(".profile-header .avatar");

  if (usernameEl) usernameEl.textContent = data.username || "User";
  if (emailEl) emailEl.textContent = data.email || "";

  // Update Avatar display
  if (data.profilePicture && data.profilePicture.startsWith("data:image")) {
    const imgTag = `<img src="${data.profilePicture}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    if (initialEl) initialEl.innerHTML = imgTag;
    if (panelAvatar) panelAvatar.innerHTML = imgTag;

    // Also update header avatar immediately if visible
    const headerAvatar = document.getElementById("avatarInitial");
    if (headerAvatar) headerAvatar.innerHTML = imgTag;

  } else {
    const initial = (data.username || "U").charAt(0).toUpperCase();
    if (initialEl) initialEl.textContent = initial;
    if (panelAvatar) panelAvatar.textContent = initial;
  }
}

// Logout function (also defined in auth.js, but accessible here too)
function logout() {
  localStorage.removeItem("bmf_logged");
  localStorage.removeItem("bmf_token");
  localStorage.removeItem("bmf_user_id");
  localStorage.removeItem("bmf_user");
  localStorage.removeItem("bmf_email");
  window.location.href = "login.html";
}

// Fetch user profile from backend
async function fetchUserProfile(userId) {
  if (!USE_BACKEND) {
    return getLocalProfile(userId);
  }

  try {
    const endpoint = userId ? `/user/profile/${userId}` : "/user/profile";
    const result = await apiRequest(endpoint);
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }

  return getLocalProfile(userId);
}

// Get profile from localStorage
function getLocalProfile(userId) {
  const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
  const id = userId || localStorage.getItem("bmf_user_id");
  return users.find(u => u.id === id) || {
    username: localStorage.getItem("bmf_user") || "Guest",
    email: localStorage.getItem("bmf_email") || "",
    bio: ""
  };
}

// Update user profile
async function updateUserProfile(data) {
  if (!USE_BACKEND) {
    return updateLocalProfile(data);
  }

  try {
    const result = await apiRequest("/user/profile", {
      method: "PUT",
      body: JSON.stringify(data)
    });

    if (result.success) {
      updateProfileUI(result.data);
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
}

// Update profile in localStorage
function updateLocalProfile(data) {
  const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
  const userId = localStorage.getItem("bmf_user_id");
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...data };
    localStorage.setItem("bmf_users", JSON.stringify(users));
    if (data.username) localStorage.setItem("bmf_user", data.username);
    if (data.email) localStorage.setItem("bmf_email", data.email);
    return { success: true, data: users[userIndex] };
  }

  return { success: false, error: "User not found" };
}

// ==========================================
// FULL PROFILE PAGE LOGIC (for profile.html)
// ==========================================

async function renderFullProfilePage() {
  const container = document.getElementById("fullProfilePanel");
  if (!container) return; // Not on profile.html

  const params = new URLSearchParams(window.location.search);
  const urlId = params.get("id");
  const currentUserId = localStorage.getItem("bmf_user_id");

  // Target ID is either from URL or current user if no URL param
  const targetUserId = urlId || currentUserId;

  if (!targetUserId) {
    container.innerHTML = `<div style="text-align:center; padding:50px;"><h2>User not found</h2></div>`;
    return;
  }

  let profileData = null;

  if (USE_BACKEND) {
    try {
      const endpoint = `/user/profile/${targetUserId}`;
      const result = await apiRequest(endpoint);
      if (result.success) {
        profileData = result.data;
      } else {
        container.innerHTML = `<div style="text-align:center; padding:50px;"><h2>User not found</h2></div>`;
        return;
      }
    } catch (e) {
      console.error("Error fetching profile", e);
      container.innerHTML = `<div style="text-align:center; padding:50px;"><h2>Error loading profile</h2></div>`;
      return;
    }
  } else {
    // Local fallback
    profileData = getLocalProfile(targetUserId);
    // Calculate counts properly for local?
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const u = users.find(x => x.id == targetUserId);
    if (u) {
      profileData = {
        ...u,
        followersCount: (u.followers || "").split(",").filter(Boolean).length,
        followingCount: (u.following || "").split(",").filter(Boolean).length,
        movieLogsCount: 12 // Fake count for demo
      };
    }
  }

  if (!profileData) {
    container.innerHTML = `<div style="text-align:center; padding:50px;"><h2>User not found</h2></div>`;
    return;
  }

  const isOwnProfile = (targetUserId == currentUserId);

  let actionButton = "";
  if (isOwnProfile) {
    actionButton = `<button class="btn primary" onclick="window.location.href='edit-profile.html'">Edit Profile</button>`;
  } else {
    actionButton = `<button id="followBtn_${targetUserId}" class="btn primary" onclick="toggleFollowUser('${targetUserId}')">Loading...</button>`;
  }

  container.innerHTML = `
        <div class="profile-header-card">
            <div class="profile-avatar-large">
                ${profileData.profilePicture ?
      `<img src="${profileData.profilePicture}" style="width:100%; height:100%; object-fit:cover;">` :
      (profileData.username || "U").charAt(0).toUpperCase()}
            </div>
            <div class="profile-info">
                <h1>
                    ${profileData.username} 
                    ${profileData.emailVerified ? '<span class="verified-badge" title="Verified">✓</span>' : ''}
                </h1>
                <p class="bio">${profileData.bio || "No bio yet."}</p>
                <div class="stats-row">
                    <div class="stat"><strong>${profileData.movieLogsCount || 0}</strong> <span>Movies</span></div>
                    <div class="stat"><strong>${profileData.followersCount || 0}</strong> <span>Followers</span></div>
                    <div class="stat"><strong>${profileData.followingCount || 0}</strong> <span>Following</span></div>
                </div>
                 <div class="profile-actions">
                    ${actionButton}
                </div>
            </div>
        </div>
    `;

  if (!isOwnProfile) {
    checkFollowStatus(targetUserId);
  }
}

async function checkFollowStatus(targetUserId) {
  if (!USE_BACKEND) return; // Local storage simplified

  const currentUserId = localStorage.getItem("bmf_user_id");
  if (!currentUserId) return;

  try {
    const result = await apiRequest(`/user/following/${currentUserId}`);
    if (result.success) {
      const isFollowing = result.data.some(u => u.id == targetUserId);
      updateFollowButtonState(targetUserId, isFollowing);
    }
  } catch (e) {
    console.error("Failed check follow", e);
  }
}

function updateFollowButtonState(userId, isFollowing) {
  const btn = document.getElementById(`followBtn_${userId}`);
  if (btn) {
    btn.textContent = isFollowing ? "Unfollow" : "Follow";
    btn.className = isFollowing ? "btn outline" : "btn primary";
    // Update onclick to pass current state
    btn.onclick = () => toggleFollowUser(userId, isFollowing);
  }
}

async function toggleFollowUser(targetUserId, currentlyFollowing) {
  if (!USE_BACKEND) {
    alert("Follow feature requires backend!");
    return;
  }

  // Optimistic UI update
  updateFollowButtonState(targetUserId, !currentlyFollowing);

  const endpoint = currentlyFollowing ? `/user/unfollow/${targetUserId}` : `/user/follow/${targetUserId}`;
  try {
    const result = await apiRequest(endpoint, { method: "POST" });
    if (!result.success) {
      // Revert on failure
      updateFollowButtonState(targetUserId, currentlyFollowing);
      alert(result.message || "Action failed");
    } else {
      // Reload profile data to update counts
      renderFullProfilePage(); // This might flickr, but ensures accurate counts
    }
  } catch (e) {
    console.error(e);
    updateFollowButtonState(targetUserId, currentlyFollowing);
  }
}
