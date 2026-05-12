/* ============================================================
   COMPLAINTS REGISTRATION PLATFORM — CLIENT-SIDE SPA
   ============================================================ */

/* ── Backend Base URL ──────────────────────────────────────────
   Change this if the backend runs on a different host/port.
   • Same-origin (served by Express):  ""   (empty string)
   • Separate dev server:              "http://localhost:3000"
   ──────────────────────────────────────────────────────────── */
const BACKEND_BASE_URL = "";  // ← edit this when needed
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

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
  renderNavbar();
  renderPage();
}

function renderNavbar() {
  const actions = document.getElementById("nav-actions");
  if (!currentUser) {
    actions.innerHTML = `
      <button class="btn btn-ghost" id="nav-login-btn" onclick="navigate('login')">Log In</button>
      <button class="btn btn-primary" id="nav-register-btn" onclick="navigate('register')" style="padding:8px 18px;font-size:0.85rem;">Sign Up</button>
    `;
  } else {
    let links = "";
    if (currentUser.role === "admin") {
      links = `<button class="btn btn-ghost" id="nav-admin-btn" onclick="navigate('admin')">Dashboard</button>`;
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
  try {
    const data = await api("/auth/me");
    currentUser = data;
    if (currentUser.role === "admin") {
      navigate("admin");
    } else {
      navigate("my-complaints");
    }
  } catch {
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
  }
  setLoading("login-btn", false);
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
    <div class="page-header">
      <h1>Admin Dashboard</h1>
      <p>Review all submitted complaints</p>
    </div>
    <div id="admin-complaints-list">
      <div class="empty-state">
        <div class="loading-spinner" style="margin:0 auto;"></div>
        <p style="margin-top:16px;">Loading complaints...</p>
      </div>
    </div>
  `;

  try {
    const data = await api("/admin/complaints");
    renderComplaintsList(
      document.getElementById("admin-complaints-list"),
      data.complaints,
      true
    );
  } catch (err) {
    document.getElementById("admin-complaints-list").innerHTML = `
      <div class="msg msg-error">${escapeHTML(err.message)}</div>
    `;
  }
}

// ─── Shared: Render Complaint Cards ─────────────────────────
function renderComplaintsList(container, complaints, showUser) {
  if (!complaints || complaints.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>No Complaints Yet</h3>
        <p>${
          showUser
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
        ${
          showUser
            ? `<span class="complaint-user-info">${escapeHTML(c.user_name)} · ${escapeHTML(c.user_email)}</span>`
            : `<span></span>`
        }
        <span class="complaint-date">${formatDate(c.created_at)}</span>
      </div>
      <div class="complaint-section">
        <div class="complaint-section-label">Complaint</div>
        <div class="complaint-section-text">${escapeHTML(c.complaint_text)}</div>
      </div>
      ${
        c.ai_question
          ? `
      <div class="complaint-section">
        <div class="complaint-section-label">AI Follow-up Question</div>
        <div class="complaint-section-text ai-text">${escapeHTML(c.ai_question)}</div>
      </div>`
          : ""
      }
      ${
        c.user_answer
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

// ─── Init ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  checkSession();
});
