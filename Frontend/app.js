/* ============================================================
   COMPLAINTS REGISTRATION PLATFORM — CLIENT-SIDE SPA
   ============================================================ */

/* ── Backend Base URL ──────────────────────────────────────────
   Change this if the backend runs on a different host/port.
   • Same-origin (served by Express):  ""   (empty string)
   • Separate dev server:              "http://localhost:3000"
   ──────────────────────────────────────────────────────────── */
const BACKEND_BASE_URL = window.location.port === "3000" ? "" : "https://complaints-registration-platform-full-8wjq.onrender.com";
const API = `${BACKEND_BASE_URL}/api`;

// ─── State ───────────────────────────────────────────────────
let currentUser = null; // { name, email, role }
let currentPage = null;

// ─── Helpers ─────────────────────────────────────────────────
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  // Handle the initial session check silently
  if (res.status === 401 && path === "/auth/me") {
    throw new Error("UNAUTHORIZED_SILENT");
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    // If response is not JSON (like a 502 HTML page from Render)
    if (!res.ok) throw new Error(`Server Error (${res.status}). Please try again later.`);
    throw new Error("Invalid response from server.");
  }

  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Modal Management ─────────────────────────────────────────
function openModal(contentHtml) {
  const container = document.getElementById("modal-container");
  container.innerHTML = `<div class="modal-content">${contentHtml}</div>`;
  container.style.display = "flex";
  document.body.style.overflow = "hidden"; // Prevent scrolling
}

function closeModal() {
  const container = document.getElementById("modal-container");
  container.style.display = "none";
  container.innerHTML = "";
  document.body.style.overflow = "auto";
}

// Close modal on click outside
window.addEventListener("click", (e) => {
  const container = document.getElementById("modal-container");
  if (e.target === container) closeModal();
});

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ─── Navigation ──────────────────────────────────────────────
function navigate(page) {
  currentPage = page;

  const navbar = document.getElementById("navbar");
  const mainContent = document.getElementById("app");

  if (page === "admin") {
    if (navbar) navbar.classList.add("hidden-admin");
    if (mainContent) mainContent.classList.add("admin-mode");
  } else {
    if (navbar) navbar.classList.remove("hidden-admin");
    if (mainContent) mainContent.classList.remove("admin-mode");
  }

  renderNavbar();
  renderPage();
}

function renderNavbar() {
  const actions = document.getElementById("nav-actions");
  if (!currentUser) {
    actions.innerHTML = `
      <button class="btn btn-ghost" onclick="navigate('track')">Track Complaint</button>
      <button class="btn btn-ghost" id="nav-login-btn" onclick="navigate('login')">Log In</button>
      <button class="btn btn-primary" id="nav-register-btn" onclick="navigate('register')" style="padding:8px 18px;font-size:0.85rem;">Sign Up</button>
    `;
  } else {
    let links = "";
    if (currentUser.role === "admin") {
      links = `<button class="btn btn-ghost" id="nav-admin-btn" onclick="navigate('admin')">Admin Dashboard</button>`;
    } else {
      links = `
        <button class="btn btn-ghost" id="nav-my-btn" onclick="navigate('my-complaints')">My Complaints</button>
        <button class="btn btn-ghost" id="nav-submit-btn" onclick="navigate('submit')">New Complaint</button>
      `;
    }
    actions.innerHTML = `
      ${links}
      <button class="btn btn-danger" id="nav-logout-btn" onclick="handleLogout()" style="padding:8px 18px;font-size:0.85rem;">Logout</button>
    `;
  }
}

function renderPage() {
  const app = document.getElementById("app");
  switch (currentPage) {
    case "track":
      renderTrackPage(app);
      break;
    case "register":
      renderRegisterPage(app);
      break;
    case "login":
      renderLoginPage(app);
      break;
    case "submit":
      renderSubmitPage(app);
      break;
    case "my-complaints":
      renderMyComplaintsPage(app);
      break;
    case "admin":
      renderAdminPage(app);
      break;
    default:
      renderLoginPage(app);
  }
}

// ─── Session Check ───────────────────────────────────────────
async function checkSession() {
  const token = localStorage.getItem("token");

  if (!token) {
    currentUser = null;
    navigate("login");
    return;
  }

  try {
    const data = await api("/auth/me");
    currentUser = data;
    if (currentUser.role === "admin") {
      navigate("admin");
    } else {
      navigate("my-complaints");
    }
  } catch (err) {
    localStorage.removeItem("token");
    currentUser = null;
    navigate("login");
  }
}

// ─── Logout ──────────────────────────────────────────────────
async function handleLogout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // Ignore
  }
  localStorage.removeItem("token");
  currentUser = null;
  showToast("Logged out successfully.");
  navigate("login");
}

// ─── Register Page ───────────────────────────────────────────
function renderRegisterPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Create Account</h1>
      <p>Get started with your complaints portal</p>
    </div>
    <div class="stepper" id="register-stepper">
      <div class="stepper-step active" id="step-1">
        <div class="stepper-dot active">1</div>
        <span class="stepper-label">Details</span>
      </div>
      <div class="stepper-line" id="line-1"></div>
      <div class="stepper-step" id="step-2">
        <div class="stepper-dot">2</div>
        <span class="stepper-label">Verify</span>
      </div>
      <div class="stepper-line" id="line-2"></div>
      <div class="stepper-step" id="step-3">
        <div class="stepper-dot">3</div>
        <span class="stepper-label">Password</span>
      </div>
    </div>

    <!-- Step 1: Name + Email -->
    <div class="card" id="register-step-1">
      <div id="reg-error-1"></div>
      <div class="form-group">
        <label class="form-label" for="reg-name">Full Name</label>
        <input class="form-input" id="reg-name" type="text" placeholder="Enter your full name" autocomplete="name" />
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-email">Email Address</label>
        <input class="form-input" id="reg-email" type="email" placeholder="you@example.com" autocomplete="email" />
      </div>
      <button class="btn btn-primary btn-full" id="reg-send-otp-btn" onclick="handleSendOtp()">Send OTP</button>
    </div>

    <!-- Step 2: OTP -->
    <div class="card hidden" id="register-step-2">
      <div id="reg-error-2"></div>
      <p style="text-align:center;color:var(--text-secondary);margin-bottom:20px;font-size:0.9rem;">
        We sent a 6-digit code to <strong id="reg-email-display" style="color:var(--primary-300);"></strong>
      </p>
      <div class="otp-group" id="otp-group">
        <input class="otp-input" type="text" maxlength="1" data-idx="0" id="otp-0" />
        <input class="otp-input" type="text" maxlength="1" data-idx="1" id="otp-1" />
        <input class="otp-input" type="text" maxlength="1" data-idx="2" id="otp-2" />
        <input class="otp-input" type="text" maxlength="1" data-idx="3" id="otp-3" />
        <input class="otp-input" type="text" maxlength="1" data-idx="4" id="otp-4" />
        <input class="otp-input" type="text" maxlength="1" data-idx="5" id="otp-5" />
      </div>
      <button class="btn btn-primary btn-full" id="reg-verify-otp-btn" onclick="handleVerifyOtpStep()">Verify OTP</button>
    </div>

    <!-- Step 3: Password -->
    <div class="card hidden" id="register-step-3">
      <div id="reg-error-3"></div>
      <div class="form-group">
        <label class="form-label" for="reg-password">Password</label>
        <input class="form-input" id="reg-password" type="password" placeholder="Choose a password" />
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-confirm">Confirm Password</label>
        <input class="form-input" id="reg-confirm" type="password" placeholder="Confirm your password" />
      </div>
      <button class="btn btn-primary btn-full" id="reg-complete-btn" onclick="handleRegister()">Complete Registration</button>
    </div>

    <div class="form-footer">
      Already have an account? <button class="text-link" id="go-to-login-link" onclick="navigate('login')">Log in</button>
    </div>
  `;

  // Setup OTP auto-focus
  setTimeout(setupOtpInputs, 0);
}

let regEmail = "";

function setupOtpInputs() {
  const inputs = document.querySelectorAll(".otp-input");
  inputs.forEach((input, i) => {
    input.addEventListener("input", (e) => {
      const val = e.target.value;
      if (val && i < inputs.length - 1) {
        inputs[i + 1].focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && i > 0) {
        inputs[i - 1].focus();
      }
    });
    // Allow only digits
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    });
  });
}

function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (el) {
    el.innerHTML = `<div class="msg msg-error">${escapeHTML(message)}</div>`;
  }
}

function clearError(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn._originalText = btn.textContent;
    btn.innerHTML = `<div class="spinner"></div> Please wait...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._originalText || "Submit";
  }
}

function updateStepper(activeStep) {
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById(`step-${i}`);
    const dot = step ? step.querySelector(".stepper-dot") : null;
    if (!step || !dot) continue;
    step.classList.remove("active");
    dot.classList.remove("active", "done");
    if (i < activeStep) {
      dot.classList.add("done");
      dot.innerHTML = "✓";
    } else if (i === activeStep) {
      step.classList.add("active");
      dot.classList.add("active");
      dot.textContent = i;
    } else {
      dot.textContent = i;
    }
  }
  // Lines
  for (let i = 1; i <= 2; i++) {
    const line = document.getElementById(`line-${i}`);
    if (line) {
      line.classList.toggle("done", i < activeStep);
    }
  }
}

async function handleSendOtp() {
  clearError("reg-error-1");
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  if (!name || !email) {
    showError("reg-error-1", "Please fill in both fields.");
    return;
  }

  setLoading("reg-send-otp-btn", true);
  try {
    await api("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ name, email }),
    });
    regEmail = email;
    document.getElementById("reg-email-display").textContent = email;
    document.getElementById("register-step-1").classList.add("hidden");
    document.getElementById("register-step-2").classList.remove("hidden");
    updateStepper(2);
    showToast("OTP sent to your email!");
    // Focus first OTP input
    setTimeout(() => document.getElementById("otp-0")?.focus(), 100);
  } catch (err) {
    showError("reg-error-1", err.message);
  }
  setLoading("reg-send-otp-btn", false);
}

function handleVerifyOtpStep() {
  clearError("reg-error-2");
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += document.getElementById(`otp-${i}`).value;
  }
  if (otp.length !== 6) {
    showError("reg-error-2", "Please enter the complete 6-digit OTP.");
    return;
  }
  // Store OTP for final register call, move to password step
  window._regOtp = otp;
  document.getElementById("register-step-2").classList.add("hidden");
  document.getElementById("register-step-3").classList.remove("hidden");
  updateStepper(3);
}

async function handleRegister() {
  clearError("reg-error-3");
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  if (!password) {
    showError("reg-error-3", "Please enter a password.");
    return;
  }
  if (password !== confirm) {
    showError("reg-error-3", "Passwords do not match.");
    return;
  }

  setLoading("reg-complete-btn", true);
  try {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: regEmail, otp: window._regOtp, password }),
    });
    showToast("Registration successful! Please log in.");
    navigate("login");
  } catch (err) {
    showError("reg-error-3", err.message);
  }
  setLoading("reg-complete-btn", false);
}

// ─── Login Page ──────────────────────────────────────────────
function renderLoginPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Welcome Back</h1>
      <p>Sign in to your complaints portal</p>
    </div>
    <div class="card">
      <div id="login-error"></div>
      <div class="form-group">
        <label class="form-label" for="login-email">Email Address</label>
        <input class="form-input" id="login-email" type="email" placeholder="you@example.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label class="form-label" for="login-password">Password</label>
        <input class="form-input" id="login-password" type="password" placeholder="Enter your password" autocomplete="current-password" />
      </div>
      <button class="btn btn-primary btn-full" id="login-btn" onclick="handleLogin()">Sign In</button>
    </div>
    <div class="form-footer">
      Don't have an account? <button class="text-link" id="go-to-register-link" onclick="navigate('register')">Create one</button>
      <div style="margin-top:15px; border-top:1px solid rgba(255,255,255,0.1); padding-top:15px;">
        <button class="text-link" style="font-size:0.75rem; color:var(--text-secondary);" onclick="navigate('admin')">Administrator? Access Portal</button>
      </div>
    </div>
  `;

  // Enter key support
  setTimeout(() => {
    const passField = document.getElementById("login-password");
    if (passField) {
      passField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleLogin();
      });
    }
  }, 0);
}

async function handleLogin() {
  clearError("login-error");
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showError("login-error", "Please enter both email and password.");
    return;
  }

  setLoading("login-btn", true);
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", data.token);
    currentUser = { name: data.name, email: data.email, role: data.role };
    showToast(`Welcome back, ${data.name}!`);
    if (data.role === "admin") {
      navigate("admin");
    } else {
      navigate("my-complaints");
    }
  } catch (err) {
    showError("login-error", err.message);
  } finally {
    setLoading("login-btn", false);
  }
}

// ─── Submit Complaint Page ───────────────────────────────────
function renderSubmitPage(container) {
  if (!currentUser) return navigate("login");

  container.innerHTML = `
    <div class="page-header">
      <h1>Submit a Complaint</h1>
      <p>Describe your issue and our AI will help gather more details</p>
    </div>
    <div class="card">
      <div id="submit-error"></div>
      <div class="form-group">
        <label class="form-label" for="complaint-text">Your Complaint</label>
        <textarea class="form-textarea" id="complaint-text" placeholder="Describe your complaint in detail..." rows="5"></textarea>
      </div>
      <button class="btn btn-secondary btn-full" id="get-ai-btn" onclick="handleGetAIQuestion()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><line x1="10" y1="22" x2="14" y2="22"/></svg>
        Get AI Follow-up Question
      </button>

      <div class="hidden" id="ai-section">
        <div class="ai-box">
          <div class="ai-box-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            AI Follow-up Question
          </div>
          <div class="ai-box-question" id="ai-question-display"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ai-answer">Your Answer</label>
          <textarea class="form-textarea" id="ai-answer" placeholder="Provide additional details..." rows="3"></textarea>
        </div>
        <button class="btn btn-primary btn-full" id="submit-complaint-btn" onclick="handleSubmitComplaint()">
          Submit Complaint
        </button>
      </div>
    </div>
  `;
}

let aiQuestion = "";

async function handleGetAIQuestion() {
  clearError("submit-error");
  const text = document.getElementById("complaint-text").value.trim();
  if (!text) {
    showError("submit-error", "Please describe your complaint first.");
    return;
  }

  setLoading("get-ai-btn", true);
  try {
    const data = await api("/ai/question", {
      method: "POST",
      body: JSON.stringify({ complaint_text: text }),
    });
    aiQuestion = data.question;
    document.getElementById("ai-question-display").textContent = data.question;
    document.getElementById("ai-section").classList.remove("hidden");
  } catch (err) {
    showError("submit-error", err.message);
  }
  setLoading("get-ai-btn", false);
}

async function handleSubmitComplaint() {
  clearError("submit-error");
  const complaint_text = document.getElementById("complaint-text").value.trim();
  const ai_answer = document.getElementById("ai-answer").value.trim();

  if (!complaint_text) {
    showError("submit-error", "Complaint text is required.");
    return;
  }

  setLoading("submit-complaint-btn", true);
  try {
    await api("/complaints", {
      method: "POST",
      body: JSON.stringify({
        complaint_text,
        ai_question: aiQuestion,
        ai_answer,
      }),
    });
    showToast("Complaint submitted successfully!");
    navigate("my-complaints");
  } catch (err) {
    showError("submit-error", err.message);
  }
  setLoading("submit-complaint-btn", false);
}

// ─── My Complaints Page ─────────────────────────────────────
async function renderMyComplaintsPage(container) {
  if (!currentUser) return navigate("login");

  container.innerHTML = `
    <div class="page-header">
      <h1>My Complaints</h1>
      <p>Track the complaints you've submitted</p>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <button class="btn btn-primary" id="new-complaint-btn" onclick="navigate('submit')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Submit New Complaint
      </button>
    </div>
    <div id="my-complaints-list">
      <div class="empty-state">
        <div class="loading-spinner" style="margin:0 auto;"></div>
        <p style="margin-top:16px;">Loading your complaints...</p>
      </div>
    </div>
  `;

  try {
    const data = await api("/complaints/my");
    renderComplaintsList(
      document.getElementById("my-complaints-list"),
      data.complaints,
      false
    );
  } catch (err) {
    document.getElementById("my-complaints-list").innerHTML = `
      <div class="msg msg-error">${escapeHTML(err.message)}</div>
    `;
  }
}

// ─── Admin Dashboard ────────────────────────────────────────
async function renderAdminPage(container) {
  if (!currentUser || currentUser.role !== "admin") return navigate("login");

  container.innerHTML = `
    <div class="admin-layout">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="background:rgba(99,102,241,0.1); padding:6px; border-radius:8px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          AdminHub
        </div>
        <div class="sidebar-nav">
          <div class="nav-item active" onclick="renderAdminDashboardView()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </div>
          <div class="nav-item" onclick="renderAdminComplaints()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Complaints
          </div>
          <div class="nav-item" onclick="renderUserManagement()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Users
          </div>
        </div>
        <div style="margin-top:auto;">
          <div class="nav-item" onclick="handleLogout()" style="color:#ef4444;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="admin-main">
        <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
          <div>
            <h1 style="font-size:1.8rem; font-weight:800; letter-spacing:-0.02em;">Welcome back, ${currentUser.name}!</h1>
            <p style="color:var(--text-muted); font-size:0.95rem;">Here's what's happening on your platform today.</p>
          </div>
          <div style="display:flex; gap:16px;">
            <div style="text-align:right;">
              <div style="font-weight:700; font-size:0.9rem;">Administrator</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${currentUser.email}</div>
            </div>
            <div style="width:40px; height:40px; background:var(--grad-purple); border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-weight:800;">
              ${currentUser.name[0]}
            </div>
          </div>
        </header>

        <div id="admin-content-area">
          <!-- Views will be injected here -->
        </div>
      </div>
    </div>
  `;

  renderAdminDashboardView();
}

async function renderAdminDashboardView() {
  // Set active state in sidebar
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector('.nav-item:nth-child(1)').classList.add('active');

  const area = document.getElementById("admin-content-area");
  area.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card card-total" onclick="renderAdminComplaints('all')">
        <p>Total Complaints</p>
        <h3 id="stat-total">...</h3>
        <div class="card-icon-bg"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
      </div>
      <div class="stat-card card-pending" onclick="renderAdminComplaints('pending')">
        <p>Pending Review</p>
        <h3 id="stat-pending">...</h3>
        <div class="card-icon-bg"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      </div>
      <div class="stat-card card-resolved" onclick="renderAdminComplaints('resolved')">
        <p>Resolved</p>
        <h3 id="stat-resolved">...</h3>
        <div class="card-icon-bg"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
      </div>
      <div class="stat-card card-users" onclick="renderUserManagement()">
        <p>Active Users</p>
        <h3 id="stat-users">...</h3>
        <div class="card-icon-bg"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
      </div>
    </div>

    <div id="admin-content-area">
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>Select a card above to manage data</h3>
      </div>
    </div>
  `;

  // Fetch stats
  try {
    const stats = await api("/admin/stats");
    document.getElementById("stat-total").innerText = stats.total ?? 0;
    document.getElementById("stat-pending").innerText = stats.pending ?? 0;
    document.getElementById("stat-resolved").innerText = stats.resolved ?? 0;
    document.getElementById("stat-users").innerText = stats.users ?? 0;
  } catch (err) {
    showToast("Stats Error: " + err.message, "error");
  }
}

async function renderAdminComplaints(filter = "all") {
  const area = document.getElementById("admin-content-area");
  area.innerHTML = `<div style="text-align:center; padding:40px;">Loading ${filter} complaints...</div>`;

  try {
    const { complaints } = await api("/admin/complaints");
    let filtered = complaints;
    if (filter !== "all") {
      filtered = complaints.filter(c => c.status === filter);
    }

    if (filtered.length === 0) {
      area.innerHTML = `<div class="empty-state"><h3>No ${filter} complaints found.</h3></div>`;
      return;
    }
    area.innerHTML = `
      <h2 style="margin-bottom:20px; font-size:1.2rem;">${filter.toUpperCase()} COMPLAINTS</h2>
      <div class="complaints-list">
        ${filtered.map(c => `
          <div class="complaint-card">
            <div style="display:flex; justify-content:space-between; align-items:start;">
              <div class="status-badge status-${c.status}">${c.status}</div>
              <div style="text-align:right; font-size:0.8rem; color:var(--text-muted);">
                ${escapeHTML(c.user_name)} (${escapeHTML(c.user_email)})
              </div>
            </div>
            <div class="complaint-section">
              <div class="complaint-section-label">ID: ${c.id}</div>
              <div class="complaint-section-text">${escapeHTML(c.complaint_text)}</div>
            </div>
            ${c.status === 'pending' ? `
              <button class="btn btn-primary btn-sm" onclick="showResolutionModal('${c.id}', '${encodeURIComponent(c.complaint_text)}')">Resolve Now</button>
            ` : `
              <div class="resolution-box">
                <div class="resolution-label" style="display:flex; justify-content:space-between; align-items:center;">
                  Resolution
                  <button class="btn btn-ghost btn-sm" style="color:var(--warning); padding:4px 8px; font-size:0.75rem; border:1px solid var(--warning);" onclick="handleReopen('${c.id}')">Reopen</button>
                </div>
                <div class="complaint-section-text">${escapeHTML(c.resolution_text)}</div>
              </div>
            `}
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function showResolutionModal(id, encodedText) {
  const complaintText = decodeURIComponent(encodedText);

  // Open modal with loading state
  openModal(`
    <div class="modal-header">
      <h3 style="margin:0;">Resolve Complaint</h3>
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="complaint-section">
        <div class="complaint-section-label">Original Complaint</div>
        <div class="complaint-section-text" style="font-style:italic;">"${escapeHTML(complaintText)}"</div>
      </div>
      <div class="form-group" style="margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <label class="form-label" style="margin:0;">Resolution Message</label>
          <span id="ai-status" style="font-size:0.75rem; color:var(--primary);">✨ AI is generating suggestion...</span>
        </div>
        <textarea id="modal-res-input" class="input-field" style="min-height:150px;" placeholder="Writing resolution..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="modal-submit-btn" onclick="handleResolve('${id}')">Submit & Send Email</button>
    </div>
  `);

  // Automatically fetch AI suggestion
  try {
    const { suggestion } = await api(`/admin/complaints/${id}/ai-suggest`, { method: "POST" });
    document.getElementById("modal-res-input").value = suggestion;
    document.getElementById("ai-status").innerText = "✨ AI suggestion ready!";
  } catch (err) {
    document.getElementById("ai-status").innerText = "❌ AI suggestion failed.";
    document.getElementById("modal-res-input").placeholder = "Enter your resolution manually...";
  }
}

async function handleResolve(id) {
  const text = document.getElementById(`modal-res-input`).value.trim();
  if (!text) return showToast("Please enter a resolution message", "error");

  setLoading("modal-submit-btn", true);
  try {
    await api(`/admin/complaints/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ resolution_text: text })
    });
    showToast("Complaint resolved and email sent!");
    closeModal();
    renderAdminComplaints(); // Refresh admin list
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading("modal-submit-btn", false);
  }
}

async function handleReopen(id) {
  if (!confirm("Are you sure you want to reopen this complaint? It will be marked as pending again.")) return;

  try {
    await api(`/admin/complaints/${id}/reopen`, {
      method: "PATCH"
    });
    showToast("Complaint reopened successfully!");
    renderAdminComplaints(); // Refresh admin list
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ─── Shared: Render Complaint Cards ─────────────────────────
function renderComplaintsList(container, complaints, showUser) {
  if (!complaints || complaints.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>No Complaints Yet</h3>
        <p>${showUser
        ? "No complaints have been submitted by any users."
        : "You haven't submitted any complaints yet."
      }</p>
      </div>
    `;
    return;
  }

  container.innerHTML = complaints
    .slice()
    .reverse()
    .map(
      (c) => `
    <div class="complaint-card">
      <div class="complaint-meta">
        ${showUser
          ? `<span class="complaint-user-info">${escapeHTML(c.user_name)} · ${escapeHTML(c.user_email)}</span>`
          : `<span></span>`
        }
        <span class="complaint-date">${formatDate(c.created_at)}</span>
      </div>
      <div class="complaint-section">
        <div class="complaint-section-label">Complaint</div>
        <div class="complaint-section-text">${escapeHTML(c.complaint_text)}</div>
      </div>
      ${c.ai_question
          ? `
      <div class="complaint-section">
        <div class="complaint-section-label">AI Follow-up Question</div>
        <div class="complaint-section-text ai-text">${escapeHTML(c.ai_question)}</div>
      </div>`
          : ""
        }
      ${c.user_answer
          ? `
      <div class="complaint-section">
        <div class="complaint-section-label">User's Answer</div>
        <div class="complaint-section-text">${escapeHTML(c.user_answer)}</div>
      </div>`
          : ""
        }
    </div>
  `
    )
    .join("");
}

async function renderUserManagement() {
  const area = document.getElementById("admin-content-area");
  area.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; animation: fadeSlideUp 0.3s ease;">
      <h2 style="font-size:1.1rem; margin:0;">USER ACCOUNTS</h2>
      <button class="btn btn-primary btn-sm" onclick="showCreateUserModal()">+ New User/Admin</button>
    </div>
    <div id="users-list-container" class="card" style="padding:0; border-radius:8px; overflow:hidden;">
      <div style="text-align:center; padding:40px; color:var(--text-muted);">Loading user database...</div>
    </div>
  `;

  try {
    const { users } = await api("/admin/users");
    const list = document.getElementById("users-list-container");

    list.innerHTML = `
      <table class="mgmt-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>
                <div style="font-weight:600;">${escapeHTML(u.name)}</div>
                <div style="font-size:0.7rem; color:var(--text-muted);">ID: ${u.id.substring(0, 8)}...</div>
              </td>
              <td>${escapeHTML(u.email)}</td>
              <td><span class="role-badge role-${u.role}">${u.role}</span></td>
              <td style="text-align:right;">
                <button class="btn btn-ghost btn-sm" onclick="showEditUserModal('${u.id}', '${escapeHTML(u.name)}', '${u.role}')">Edit</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--error);" onclick="handleDeleteUser('${u.id}')">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    showToast(err.message, "error");
  }
}

function showCreateUserModal() {
  openModal(`
    <div class="modal-header"><h3>Create New Account</h3><button class="btn btn-ghost" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Full Name</label><input id="mu-name" class="input-field"></div>
      <div class="form-group"><label class="form-label">Email</label><input id="mu-email" class="input-field"></div>
      <div class="form-group"><label class="form-label">Password</label><input id="mu-pass" type="password" class="input-field"></div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select id="mu-role" class="input-field" style="background:var(--bg-input);">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-create-u" onclick="handleCreateUser()">Create User</button>
    </div>
  `);
}

async function handleCreateUser() {
  const name = document.getElementById("mu-name").value;
  const email = document.getElementById("mu-email").value;
  const password = document.getElementById("mu-pass").value;
  const role = document.getElementById("mu-role").value;

  setLoading("btn-create-u", true);
  try {
    await api("/admin/users", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role })
    });
    showToast("User created!");
    closeModal();
    renderUserManagement();
    renderAdminDashboard(document.getElementById("app"));
  } catch (err) { showToast(err.message, "error"); }
  finally { setLoading("btn-create-u", false); }
}

function showEditUserModal(id, name, role) {
  openModal(`
    <div class="modal-header"><h3>Edit User</h3><button class="btn btn-ghost" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Name</label><input id="eu-name" value="${name}" class="input-field"></div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select id="eu-role" class="input-field" style="background:var(--bg-input);">
          <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
          <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-edit-u" onclick="handleEditUser('${id}')">Save Changes</button>
    </div>
  `);
}

async function handleEditUser(id) {
  const name = document.getElementById("eu-name").value;
  const role = document.getElementById("eu-role").value;
  setLoading("btn-edit-u", true);
  try {
    await api(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, role })
    });
    showToast("User updated");
    closeModal();
    renderUserManagement();
  } catch (err) { showToast(err.message, "error"); }
  finally { setLoading("btn-edit-u", false); }
}

async function handleDeleteUser(id) {
  if (!confirm("Are you sure?")) return;
  try {
    await api(`/admin/users/${id}`, { method: "DELETE" });
    showToast("User deleted");
    renderUserManagement();
    renderAdminDashboard(document.getElementById("app"));
  } catch (err) { showToast(err.message, "error"); }
}

// ─── Init ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  checkSession();
});
