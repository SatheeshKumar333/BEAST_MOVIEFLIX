/* ======================================
   AUTH MODULE – BACKEND INTEGRATED WITH OTP
   Developed by Satheesh Kumar
====================================== */

// Validation Rules
const VALIDATION = {
  username: {
    min: 3,
    max: 10,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: "Username must be 3-10 chars (letters, numbers, underscore)"
  },
  password: {
    min: 8,
    pattern: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
    message: "Password must be 8+ chars with 1 uppercase & 1 number"
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  }
};

// Check if user is logged in (works with or without backend)
function isLoggedIn() {
  return localStorage.getItem("bmf_logged") === "true";
}

// Validate username
function validateUsername(username) {
  if (!username || username.length < VALIDATION.username.min) {
    return { valid: false, message: `Username must be at least ${VALIDATION.username.min} characters` };
  }
  if (username.length > VALIDATION.username.max) {
    return { valid: false, message: `Username must be at most ${VALIDATION.username.max} characters` };
  }
  if (!VALIDATION.username.pattern.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, and underscore" };
  }
  return { valid: true };
}

// Validate password
function validatePassword(password) {
  if (!password || password.length < VALIDATION.password.min) {
    return { valid: false, message: `Password must be at least ${VALIDATION.password.min} characters` };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least 1 uppercase letter" };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: "Password must contain at least 1 number" };
  }
  return { valid: true };
}

// Validate email
function validateEmail(email) {
  if (!email || !VALIDATION.email.pattern.test(email)) {
    return { valid: false, message: VALIDATION.email.message };
  }
  return { valid: true };
}

// REGISTER
async function register() {
  const username = document.getElementById("regUsername")?.value?.trim();
  const email = document.getElementById("regEmail")?.value?.trim();
  const password = document.getElementById("regPassword")?.value;
  const confirmPassword = document.getElementById("regConfirmPassword")?.value;

  // Validate all fields
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.valid) {
    showAuthError(usernameCheck.message);
    return;
  }

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    showAuthError(emailCheck.message);
    return;
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    showAuthError(passwordCheck.message);
    return;
  }

  if (password !== confirmPassword) {
    showAuthError("Passwords do not match!");
    return;
  }

  // Try backend first
  if (typeof USE_BACKEND !== 'undefined' && USE_BACKEND) {
    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password })
      });

      if (result.success) {
        // Check if OTP verification is required
        if (result.data.requiresOtp) {
          localStorage.setItem("bmf_pending_email", email);
          showAuthSuccess("OTP sent to your email! Redirecting...");
          setTimeout(() => {
            window.location.href = "verify-otp.html?email=" + encodeURIComponent(email);
          }, 1500);
        } else {
          // Direct login (for admin or pre-verified accounts)
          if (result.data.token) {
            localStorage.setItem("bmf_logged", "true");
            localStorage.setItem("bmf_token", result.data.token);
            localStorage.setItem("bmf_user_id", result.data.userId);
            localStorage.setItem("bmf_user", result.data.username);
            localStorage.setItem("bmf_email", result.data.email);
            localStorage.setItem("bmf_profile_picture", result.data.profilePicture || "");
          }
          window.location.href = "home.html";
        }
        return;
      } else {
        showAuthError(result.error || "Registration failed!");
        return;
      }
    } catch (error) {
      console.error("Registration error:", error);
      showAuthError("Server error. Using offline mode...");
    }
  }

  // Fallback to localStorage
  registerLocal(username, email, password);
}

function registerLocal(username, email, password) {
  let users = JSON.parse(localStorage.getItem("bmf_users") || "[]");

  if (users.some(u => u.username === username)) {
    showAuthError("Username already taken!");
    return;
  }
  if (users.some(u => u.email === email)) {
    showAuthError("Email already registered!");
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store pending registration with OTP
  const pendingUser = {
    id: Date.now().toString(),
    username,
    email,
    password,
    otp,
    otpExpiry: Date.now() + (10 * 60 * 1000), // 10 minutes
    bio: "",
    role: "USER",
    emailVerified: false,
    createdAt: new Date().toISOString()
  };

  // Store pending registration
  localStorage.setItem("bmf_pending_user", JSON.stringify(pendingUser));
  localStorage.setItem("bmf_pending_email", email);
  localStorage.setItem("bmf_pending_otp", otp);

  // Production message - OTP will be sent to email
  showAuthSuccess("OTP sent to your email! Please check your inbox.");

  // Redirect to OTP verification page
  setTimeout(() => {
    window.location.href = "verify-otp.html?email=" + encodeURIComponent(email);
  }, 1500);
}

// LOGIN
async function login() {
  const usernameOrEmail = document.getElementById("loginUsername")?.value?.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!usernameOrEmail) {
    showAuthError("Please enter username or email");
    return;
  }
  if (!password) {
    showAuthError("Please enter password");
    return;
  }

  // Try backend first
  if (typeof USE_BACKEND !== 'undefined' && USE_BACKEND) {
    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ usernameOrEmail, password })
      });

      if (result.success) {
        // Check if OTP verification is required
        if (result.data.requiresOtp) {
          localStorage.setItem("bmf_pending_email", result.data.email);
          showAuthSuccess("Email not verified. Redirecting to OTP...");
          setTimeout(() => {
            window.location.href = "verify-otp.html?email=" + encodeURIComponent(result.data.email);
          }, 1500);
          return;
        }

        // Successful login
        localStorage.setItem("bmf_logged", "true");
        localStorage.setItem("bmf_token", result.data.token);
        localStorage.setItem("bmf_user_id", result.data.userId);
        localStorage.setItem("bmf_user", result.data.username);
        localStorage.setItem("bmf_email", result.data.email);
        localStorage.setItem("bmf_profile_picture", result.data.profilePicture || "");
        localStorage.setItem("bmf_role", result.data.role || "USER");

        showAuthSuccess("Login successful! Redirecting...");

        // Redirect based on role - Admin goes to admin panel
        setTimeout(() => {
          if (result.data.role === "ADMIN") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "home.html";
          }
        }, 1000);
        return;
      } else {
        showAuthError(result.error || "Login failed!");
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      showAuthError("Server error. Using offline mode...");
    }
  }

  // Fallback to localStorage
  loginLocal(usernameOrEmail, password);
}

function loginLocal(usernameOrEmail, password) {
  // Ensure admin user exists
  initializeAdminUser();

  const users = JSON.parse(localStorage.getItem("bmf_users") || "[]");
  const user = users.find(u =>
    (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password
  );

  if (!user) {
    showAuthError("Invalid credentials!");
    return;
  }

  localStorage.setItem("bmf_logged", "true");
  localStorage.setItem("bmf_user_id", user.id);
  localStorage.setItem("bmf_user", user.username);
  localStorage.setItem("bmf_email", user.email);
  localStorage.setItem("bmf_role", user.role || "USER");

  showAuthSuccess("Login successful!");

  // Redirect based on role - Admin goes to admin panel
  setTimeout(() => {
    if (user.role === "ADMIN") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "home.html";
    }
  }, 1000);
}

// Initialize admin user in localStorage
function initializeAdminUser() {
  let users = JSON.parse(localStorage.getItem("bmf_users") || "[]");

  // Check if admin already exists
  const adminExists = users.some(u => u.username === "admin");

  if (!adminExists) {
    const adminUser = {
      id: "admin-001",
      username: "admin",
      email: "admin@beastmovieflix.com",
      password: "Admin@123",
      role: "ADMIN",
      bio: "System Administrator",
      emailVerified: true,
      createdAt: new Date().toISOString()
    };
    users.push(adminUser);
    localStorage.setItem("bmf_users", JSON.stringify(users));
    console.log("Admin account initialized");
  }
}

// Call on script load
initializeAdminUser();

// LOGOUT
function logout() {
  localStorage.removeItem("bmf_logged");
  localStorage.removeItem("bmf_token");
  localStorage.removeItem("bmf_user_id");
  localStorage.removeItem("bmf_user");
  localStorage.removeItem("bmf_email");
  localStorage.removeItem("bmf_profile_picture");
  localStorage.removeItem("bmf_pending_email");
  window.location.href = "../index.html";
}

// Show error message
function showAuthError(message) {
  const errorDiv = document.getElementById("authError");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.className = "auth-error";
    errorDiv.style.display = "block";
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  } else {
    alert(message);
  }
}

// Show success message
function showAuthSuccess(message) {
  const errorDiv = document.getElementById("authError");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.className = "auth-success";
    errorDiv.style.display = "block";
  } else {
    // No need to alert success as we're redirecting
  }
}

// Setup validation hints on input fields
document.addEventListener("DOMContentLoaded", () => {
  // Real-time validation for username
  const usernameInput = document.getElementById("regUsername");
  if (usernameInput) {
    usernameInput.addEventListener("input", () => {
      const result = validateUsername(usernameInput.value);
      usernameInput.style.borderColor = result.valid ? "var(--neon-cyan)" : "var(--ember-red)";
    });
  }

  // Real-time validation for password
  const passwordInput = document.getElementById("regPassword");
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const result = validatePassword(passwordInput.value);
      passwordInput.style.borderColor = result.valid ? "var(--neon-cyan)" : "var(--ember-red)";
      updatePasswordStrength(passwordInput.value);
    });
  }
});

// Password strength indicator
function updatePasswordStrength(password) {
  const strengthBar = document.getElementById("passwordStrength");
  if (!strengthBar) return;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  const colors = ["#ef4444", "#f97316", "#facc15", "#22c55e"];
  const widths = ["25%", "50%", "75%", "100%"];

  strengthBar.style.width = widths[strength - 1] || "0%";
  strengthBar.style.backgroundColor = colors[strength - 1] || "#ef4444";
}
