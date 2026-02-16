/* ======================================
   FRIENDS & GROUPS – BACKEND INTEGRATED
   Developed by Satheesh Kumar
====================================== */

let currentGroupId = null;
let chatRefreshInterval = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Check localStorage directly for login status
  const logged = localStorage.getItem("bmf_logged") === "true";
  if (!logged) {
    alert("Please login to access friends & groups!");
    window.location.href = "login.html";
    return;
  }

  await loadGroups();
  loadFollowers();
  loadFollowing();
});

// ========== GROUPS ==========
// ========== GROUPS ==========
async function loadGroups() {
  let groups = [];

  if (USE_BACKEND) {
    const result = await apiRequest("/groups");
    if (result.success) {
      groups = result.data;
    }
  }

  if (groups.length === 0) {
    // Fallback to localStorage
    const localGroups = JSON.parse(localStorage.getItem("bmf_groups") || "[]");
    const userId = localStorage.getItem("bmf_user_id");
    groups = localGroups.filter(g =>
      g.creatorId === userId || g.members?.includes(userId)
    );
  }

  const container = document.getElementById("groupsContainer"); // Matched HTML ID
  if (!container) return;

  if (groups.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <p>No groups yet! <button class="btn link" onclick="openCreateModal()">Create one</button> to start discussions.</p>
            </div>
        `;
    return;
  }

  const userId = localStorage.getItem("bmf_user_id");

  container.innerHTML = `
        <div class="groups-list-grid">
            ${groups.map(group => `
                <div class="group-card">
                    <div class="group-card-header" onclick="openGroup(${group.id})">
                        <h3>📁 ${group.name}</h3>
                        <p>${group.description || "No description"}</p>
                        <span class="group-meta">${group.memberCount || group.members?.length || 1} members</span>
                    </div>
                    <div class="group-card-actions">
                        <button class="btn secondary small" onclick="event.stopPropagation(); openAddPersonModal(${group.id})" title="Add Person">➕ Add</button>
                        ${group.creatorId === userId ? `<button class="btn danger small" onclick="event.stopPropagation(); deleteGroup(${group.id})" title="Delete Group">🗑️</button>` : ""}
                    </div>
                </div>
            `).join("")}
            <button class="create-group-card" onclick="openCreateModal()">
                <span>+ Create Group</span>
            </button>
        </div>
  `;
}

// Delete Group
function deleteGroup(groupId) {
  if (!confirm("Are you sure you want to delete this group?")) return;

  let groups = JSON.parse(localStorage.getItem("bmf_groups") || "[]");
  const userId = localStorage.getItem("bmf_user_id");

  // Only creator can delete
  const group = groups.find(g => g.id === groupId);
  if (!group || group.creatorId !== userId) {
    alert("You can only delete groups you created!");
    return;
  }

  groups = groups.filter(g => g.id !== groupId);
  localStorage.setItem("bmf_groups", JSON.stringify(groups));
  loadGroups();
  alert("Group deleted!");
}

// Add Person Modal
let addPersonGroupId = null;
let selectedUserId = null;

function openAddPersonModal(groupId) {
  addPersonGroupId = groupId;
  selectedUserId = null;
  const modal = document.getElementById("addPersonModal");
  const overlay = document.getElementById("modalOverlay");
  if (modal) modal.classList.add("show");
  if (overlay) overlay.classList.add("show");

  // Setup autocomplete
  const input = document.getElementById("addPersonInput");
  if (input) {
    input.value = "";
    input.addEventListener("input", handleUserSearch);
    input.focus();
  }

  // Clear suggestions
  const suggestionsDiv = document.getElementById("userSuggestions");
  if (suggestionsDiv) suggestionsDiv.innerHTML = "";
}

function closeAddPersonModal() {
  const modal = document.getElementById("addPersonModal");
  const overlay = document.getElementById("modalOverlay");
  if (modal) modal.classList.remove("show");
  if (overlay) overlay.classList.remove("show");
  const input = document.getElementById("addPersonInput");
  if (input) {
    input.value = "";
    input.removeEventListener("input", handleUserSearch);
  }
  const suggestionsDiv = document.getElementById("userSuggestions");
  if (suggestionsDiv) suggestionsDiv.innerHTML = "";
  addPersonGroupId = null;
  selectedUserId = null;
}

// Autocomplete search handler
async function handleUserSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const suggestionsDiv = document.getElementById("userSuggestions");

  if (!suggestionsDiv) return;

  if (query.length < 1) {
    suggestionsDiv.innerHTML = "";
    return;
  }

  // Filter users
  let matches = [];

  if (USE_BACKEND) {
    try {
      const result = await apiRequest(`/user/search?query=${encodeURIComponent(query)}`);
      if (result.success) {
        matches = result.data;
      }
    } catch (e) {
      console.error("Search failed:", e);
    }
  } else {
    // Local fallback
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    matches = users.filter(u =>
      u.username.toLowerCase().includes(query)
    );
  }

  // Common filtering (exclude self and group members)
  matches = matches.filter(u =>
    u.id != currentUserId && // ID might be string or number
    !groupMembers.includes(u.id)
  ).slice(0, 5);

  if (matches.length === 0) {
    suggestionsDiv.innerHTML = `<div class="no-suggestions">No users found</div>`;
    return;
  }

  suggestionsDiv.innerHTML = matches.map(user => `
    <div class="user-suggestion" onclick="selectUser('${user.id}', '${user.username}')">
      <div class="suggestion-avatar">${user.username.charAt(0).toUpperCase()}</div>
      <span>${user.username}</span>
    </div>
  `).join("");
}

// Select a user from suggestions
function selectUser(userId, username) {
  selectedUserId = userId;
  const input = document.getElementById("addPersonInput");
  if (input) input.value = username;
  const suggestionsDiv = document.getElementById("userSuggestions");
  if (suggestionsDiv) suggestionsDiv.innerHTML = "";
}

function addPersonToGroup() {
  const username = document.getElementById("addPersonInput")?.value?.trim();
  if (!username) {
    alert("Please enter a username!");
    return;
  }

  const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");

  // If a user was selected from suggestions, use that; otherwise search by username
  let userToAdd;
  if (selectedUserId) {
    userToAdd = users.find(u => u.id === selectedUserId);
  } else {
    userToAdd = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  if (!userToAdd) {
    alert("User not found! Please select a user from the suggestions.");
    return;
  }

  let groups = JSON.parse(localStorage.getItem("bmf_groups") || "[]");
  const groupIndex = groups.findIndex(g => g.id === addPersonGroupId);

  if (groupIndex === -1) {
    alert("Group not found!");
    return;
  }

  if (groups[groupIndex].members?.includes(userToAdd.id)) {
    alert("User is already in this group!");
    return;
  }

  groups[groupIndex].members = groups[groupIndex].members || [];
  groups[groupIndex].members.push(userToAdd.id);
  localStorage.setItem("bmf_groups", JSON.stringify(groups));

  closeAddPersonModal();
  loadGroups();
  alert(`${userToAdd.username} added to the group!`);
}

async function createGroup() {
  const name = document.getElementById("groupNameInput")?.value?.trim(); // Matched HTML ID
  // Description input missing in HTML, we can add it or just use name
  const description = "";

  if (!name || name.length < 2) {
    alert("Group name must be at least 2 characters!");
    return;
  }

  if (USE_BACKEND) {
    const selectedMembers = Array.from(document.querySelectorAll("#selectedGroupMembers .member-tag"))
      .map(el => el.dataset.id);

    const result = await apiRequest("/groups", {
      method: "POST",
      body: JSON.stringify({ name, description, memberIds: selectedMembers })
    });

    if (result.success) {
      closeCreateModal();
      await loadGroups();
      alert("Group created successfully! 🎉");
      return;
    }
  }

  // Fallback to localStorage
  createGroupLocal(name, description);
}

function createGroupLocal(name, description) {
  const groups = JSON.parse(localStorage.getItem("bmf_groups") || "[]");
  const userId = localStorage.getItem("bmf_user_id");
  const username = localStorage.getItem("bmf_user");

  const newGroup = {
    id: Date.now(),
    name,
    description,
    creatorId: userId,
    creatorName: username,
    members: [userId],
    messages: [],
    createdAt: new Date().toISOString()
  };

  groups.push(newGroup);
  localStorage.setItem("bmf_groups", JSON.stringify(groups));
  closeCreateModal();
  loadGroups();
  alert("Group created successfully! 🎉");
}

async function openGroup(groupId) {
  currentGroupId = groupId;
  let groupDetails;

  if (USE_BACKEND) {
    const result = await apiRequest(`/groups/${groupId}`);
    if (result.success) {
      groupDetails = result.data;
    }
  }

  if (!groupDetails) {
    const groups = JSON.parse(localStorage.getItem("bmf_groups") || "[]");
    groupDetails = groups.find(g => g.id === groupId);
  }

  if (!groupDetails) {
    alert("Group not found!");
    return;
  }

  displayGroupChat(groupDetails);

  // Start chat refresh
  if (chatRefreshInterval) clearInterval(chatRefreshInterval);
  chatRefreshInterval = setInterval(() => refreshMessages(groupId), 5000);
}

function displayGroupChat(group) {
  const chatView = document.getElementById("groupChatView");
  const mainView = document.getElementById("friendsMainView");

  if (!chatView) return;

  if (mainView) mainView.style.display = "none";
  chatView.style.display = "flex";

  // Get member count
  const memberCount = group.memberCount || group.members?.length || 1;

  // Create/update chat UI
  chatView.innerHTML = `
    <div class="chat-header">
      <button class="btn icon" onclick="closeGroupChat()">⬅️</button>
      <div>
        <h2 id="groupTitle">${group.name}</h2>
        <small style="color: rgba(255,255,255,0.8); font-size: 12px;">${memberCount} member${memberCount !== 1 ? 's' : ''}</small>
      </div>
    </div>
    <div id="chatMessages" class="chat-messages"></div>
    <div class="chat-input-area">
      <input type="text" id="messageInput" placeholder="Type a message..." />
      <button onclick="sendMessage()">Send</button>
    </div>
  `;

  const messagesContainer = document.getElementById("chatMessages");
  const messages = group.recentMessages || group.messages || [];
  const currentUser = localStorage.getItem("bmf_user");

  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="empty-chat">No messages yet. Start the conversation!</div>';
  } else {
    messagesContainer.innerHTML = messages.map(msg => {
      const isOwn = msg.senderName === currentUser;
      return `
        <div class="chat-message ${isOwn ? "own" : ""}">
          <span class="sender">${msg.senderName}</span>
          <p class="content">${msg.content}</p>
          <span class="time">${formatTime(msg.createdAt)}</span>
        </div>
      `;
    }).join("");
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Bind Enter key to send
  const messageInput = document.getElementById("messageInput");
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        sendMessage();
      }
    });
  }
}

// Send message in group chat
async function sendMessage() {
  const input = document.getElementById("messageInput");
  const content = input?.value?.trim();

  if (!content || content.length === 0) {
    return;
  }

  if (!currentGroupId) {
    alert("No group selected!");
    return;
  }

  const messageData = {
    groupId: currentGroupId,
    content: content
  };

  // Try backend first
  if (USE_BACKEND) {
    const result = await apiRequest(`/groups/${currentGroupId}/messages`, {
      method: "POST",
      body: JSON.stringify(messageData)
    });

    if (result.success) {
      input.value = "";
      await refreshMessages(currentGroupId);
      return;
    }
  }

  // Fallback to localStorage
  sendMessageLocal(currentGroupId, content);
  input.value = "";
}

function sendMessageLocal(groupId, content) {
  const groups = JSON.parse(localStorage.getItem("bmf_groups") || "[]");
  const groupIndex = groups.findIndex(g => g.id === groupId);

  if (groupIndex === -1) return;

  const userId = localStorage.getItem("bmf_user_id");
  const username = localStorage.getItem("bmf_user");

  const newMessage = {
    id: Date.now(),
    senderId: userId,
    senderName: username,
    content: content,
    createdAt: new Date().toISOString()
  };

  groups[groupIndex].messages = groups[groupIndex].messages || [];
  groups[groupIndex].messages.push(newMessage);

  localStorage.setItem("bmf_groups", JSON.stringify(groups));

  // Refresh display
  const group = groups[groupIndex];
  displayGroupChat(group);
}

async function refreshMessages(groupId) {
  if (USE_BACKEND) {
    const result = await apiRequest(`/groups/${groupId}`);
    if (result.success) {
      displayGroupChat(result.data);
      return;
    }
  }

  // Fallback to localStorage
  const groups = JSON.parse(localStorage.getItem("bmf_groups") || "[]");
  const group = groups.find(g => g.id === groupId);
  if (group) {
    displayGroupChat(group);
  }
}

function closeGroupChat() {
  if (chatRefreshInterval) clearInterval(chatRefreshInterval);
  currentGroupId = null;

  document.getElementById("groupChatView").style.display = "none";
  document.getElementById("friendsMainView").style.display = "block";
}

// ========== FOLLOWERS/FOLLOWING ==========
// ========== FOLLOWERS/FOLLOWING ==========
async function loadFollowers() {
  const container = document.getElementById("followersContainer");
  if (!container) return;

  let followers = [];

  if (USE_BACKEND) {
    const userId = localStorage.getItem("bmf_user_id");
    try {
      const result = await apiRequest(`/user/followers/${userId}`);
      if (result.success) {
        followers = result.data;
      }
    } catch (e) { console.error(e); }
  } else {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const userId = localStorage.getItem("bmf_user_id");
    const user = users.find(u => u.id == userId); // lenient check
    const followerIds = user?.followers?.split(",").filter(Boolean) || [];
    followers = followerIds.map(id => {
      const u = users.find(x => x.id == id);
      return u ? { id: u.id, username: u.username, profilePicture: u.profilePicture } : { id, username: "User" };
    });
  }

  if (followers.length === 0) {
    container.innerHTML = '<div class="empty-state small">No followers yet</div>';
    return;
  }

  container.innerHTML = followers.map(f => `
            <div class="user-card" onclick="window.location.href='profile.html?id=${f.id}'">
                <div class="user-avatar">
                   ${f.profilePicture ? `<img src="${f.profilePicture}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : (f.username?.charAt(0)?.toUpperCase() || "U")}
                </div>
                <span>${f.username}</span>
            </div>
        `).join("");
}

async function loadFollowing() {
  const container = document.getElementById("followingContainer");
  if (!container) return;

  let following = [];

  if (USE_BACKEND) {
    const userId = localStorage.getItem("bmf_user_id");
    try {
      const result = await apiRequest(`/user/following/${userId}`);
      if (result.success) {
        following = result.data;
      }
    } catch (e) { console.error(e); }
  } else {
    // Local fallback logic similar to above but for following
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    const userId = localStorage.getItem("bmf_user_id");
    const user = users.find(u => u.id == userId);
    const followingIds = user?.following?.split(",").filter(Boolean) || [];
    following = followingIds.map(id => {
      const u = users.find(x => x.id == id);
      return u ? { id: u.id, username: u.username, profilePicture: u.profilePicture } : { id, username: "User" };
    });
  }

  if (following.length === 0) {
    container.innerHTML = '<div class="empty-state small">Not following anyone yet</div>';
    return;
  }

  container.innerHTML = following.map(f => `
            <div class="user-card" onclick="window.location.href='profile.html?id=${f.id}'">
                <div class="user-avatar">
                    ${f.profilePicture ? `<img src="${f.profilePicture}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : (f.username?.charAt(0)?.toUpperCase() || "U")}
                </div>
                <span>${f.username}</span>
            </div>
        `).join("");
}

// ========== MODALS ==========
let selectedCreationMembers = [];

function openCreateModal() {
  const modal = document.getElementById("groupModal"); // Matched HTML ID
  const overlay = document.getElementById("modalOverlay");
  if (modal) modal.classList.add("show");
  if (overlay) overlay.classList.add("show");

  // Clear inputs
  selectedCreationMembers = [];
  renderSelectedMembers();

  const memberInput = document.getElementById("groupMemberInput");
  if (memberInput) {
    memberInput.value = "";
    memberInput.addEventListener("input", handleGroupMemberSearch);
  }

  // Bind create button
  const startBtn = document.getElementById("createGroupBtn");
  if (startBtn) startBtn.onclick = createGroup;
}

async function handleGroupMemberSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const suggestionsDiv = document.getElementById("groupMemberSuggestions");

  if (!suggestionsDiv) return;
  if (query.length < 1) {
    suggestionsDiv.innerHTML = "";
    return;
  }

  let matches = [];
  if (USE_BACKEND) {
    try {
      const result = await apiRequest(`/user/search?query=${encodeURIComponent(query)}`);
      if (result.success) matches = result.data;
    } catch (e) { }
  } else {
    const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
    matches = users.filter(u => u.username.toLowerCase().includes(query));
  }

  const currentUserId = localStorage.getItem("bmf_user_id");

  // Filter
  matches = matches.filter(u =>
    u.id != currentUserId &&
    !selectedCreationMembers.some(m => m.id === u.id)
  ).slice(0, 5);

  if (matches.length === 0) {
    suggestionsDiv.innerHTML = '<div class="no-suggestions">No users found</div>';
    return;
  }

  suggestionsDiv.innerHTML = matches.map(user => `
        <div class="user-suggestion" onclick="addMemberToCreationList('${user.id}', '${user.username}')">
            <div class="suggestion-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <span>${user.username}</span>
        </div>
    `).join("");
}

function addMemberToCreationList(id, username) {
  if (selectedCreationMembers.some(m => m.id === id)) return;
  selectedCreationMembers.push({ id, username });
  renderSelectedMembers();
  document.getElementById("groupMemberInput").value = "";
  document.getElementById("groupMemberSuggestions").innerHTML = "";
}

function removeMemberFromCreationList(id) {
  selectedCreationMembers = selectedCreationMembers.filter(m => m.id !== id);
  renderSelectedMembers();
}

function renderSelectedMembers() {
  const container = document.getElementById("selectedGroupMembers");
  if (!container) return;

  container.innerHTML = selectedCreationMembers.map(m => `
        <span class="member-tag" data-id="${m.id}">
            ${m.username}
            <span class="remove" onclick="removeMemberFromCreationList('${m.id}')">×</span>
        </span>
    `).join("");
}

function hideGroupModal() { // Renamed to match HTML onclick
  const modal = document.getElementById("groupModal");
  const overlay = document.getElementById("modalOverlay");
  if (modal) modal.classList.remove("show");
  if (overlay) overlay.classList.remove("show");

  const input = document.getElementById("groupNameInput");
  if (input) input.value = "";
}

function closeCreateModal() { hideGroupModal(); }

// ========== HELPERS ==========
function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
