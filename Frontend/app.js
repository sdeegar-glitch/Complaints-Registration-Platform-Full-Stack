let currentUser = null;
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://complaints-registration-platform-full-8wjq.onrender.com/api';

async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  
  let data;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } else {
    const text = await res.text();
    data = { message: text };
  }

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Authority Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }
  return data;
}

function navigate(page, params = {}) {
  const app = document.getElementById("app");
  const mainView = document.getElementById("main-view");
  const landingHero = document.getElementById("landing-hero");

  // Reset UI
  if (landingHero) landingHero.classList.add("hidden");
  if (mainView) {
    mainView.innerHTML = "";
    mainView.classList.add("hidden");
  }

  // Home logic
  if (page === "home") {
    if (landingHero) landingHero.classList.remove("hidden");
    renderNavbar();
    return;
  }

  // Auth Guard
  const publicPages = ["login", "register", "departments", "contact"];
  if (!publicPages.includes(page) && !currentUser) {
    navigate("login");
    return;
  }

  if (mainView) mainView.classList.remove("hidden");
  renderNavbar();

  switch (page) {
    case "login": renderLoginPage(mainView); break;
    case "register": renderRegisterPage(mainView); break;
    case "submit": renderSubmitPage(mainView); break;
    case "my-complaints": renderMyComplaintsPage(mainView); break;
    case "track": renderTrackPage(mainView, params.id); break;
    case "admin": renderAdminDashboard(mainView); break;
    case "departments": renderDepartmentsPage(mainView); break;
    case "contact": renderContactPage(mainView); break;
    default: navigate("home");
  }
}

function renderNavbar() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;

  const isLoggedIn = !!currentUser;
  const isAdmin = currentUser?.role === "admin";

  nav.innerHTML = `
    <div class="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between relative">
      <div class="flex items-center gap-12">
        <a href="javascript:void(0)" onclick="navigate('home')" class="flex items-center gap-3 sm:gap-4 group">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
             <i class="fa-solid fa-shield-halved text-lg sm:text-xl"></i>
          </div>
          <div class="font-display font-black text-xl sm:text-2xl tracking-tighter text-slate-900">PoliceGrievance</div>
        </a>
        <div class="hidden md:flex items-center gap-8">
          <a href="javascript:void(0)" onclick="navigate('home')" class="nav-link font-bold text-slate-500 hover:text-primary transition-colors">Home</a>
          <a href="javascript:void(0)" onclick="navigate('departments')" class="nav-link font-bold text-slate-500 hover:text-primary transition-colors">Departments</a>
          <a href="javascript:void(0)" onclick="navigate('contact')" class="nav-link font-bold text-slate-500 hover:text-primary transition-colors">Contact</a>
        </div>
      </div>
      
      <!-- Desktop Navigation Actions -->
      <div class="hidden md:flex items-center gap-6">
        ${isLoggedIn ? `
          ${isAdmin ? `<a href="javascript:void(0)" onclick="navigate('admin')" class="btn btn-ghost text-secondary font-black hover:text-secondary/80">Director's Console</a>` : ''}
          <a href="javascript:void(0)" onclick="navigate('my-complaints')" class="btn btn-ghost font-black hover:text-primary/80">Dashboard</a>
          <button onclick="handleLogout()" class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-secondary hover:text-white transition-all shadow-sm">
            <i class="fa-solid fa-power-off"></i>
          </button>
        ` : `
          <a href="javascript:void(0)" onclick="navigate('login')" class="font-black text-slate-900 hover:text-primary px-4">Sign In</a>
          <button onclick="navigate('register')" class="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">Join Portal</button>
        `}
      </div>

      <!-- Mobile Hamburger Button -->
      <div class="flex md:hidden items-center gap-4">
        <button id="mobile-menu-btn" class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-all">
          <i class="fa-solid fa-bars text-lg"></i>
        </button>
      </div>

      <!-- Mobile Dropdown Menu Container -->
      <div id="mobile-dropdown" class="hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl shadow-2xl border-t border-slate-100 px-6 py-8 flex flex-col gap-6 md:hidden transition-all duration-300 ease-in-out z-[999] rounded-b-[24px]">
        <div class="flex flex-col gap-4">
          <a href="javascript:void(0)" onclick="closeMobileMenu(); navigate('home')" class="font-black text-slate-700 hover:text-primary text-lg flex items-center gap-3"><i class="fa-solid fa-house text-slate-400"></i> Home</a>
          <a href="javascript:void(0)" onclick="closeMobileMenu(); navigate('departments')" class="font-black text-slate-700 hover:text-primary text-lg flex items-center gap-3"><i class="fa-solid fa-building-shield text-slate-400"></i> Departments</a>
          <a href="javascript:void(0)" onclick="closeMobileMenu(); navigate('contact')" class="font-black text-slate-700 hover:text-primary text-lg flex items-center gap-3"><i class="fa-solid fa-envelope text-slate-400"></i> Contact</a>
        </div>
        <hr class="border-slate-100" />
        <div class="flex flex-col gap-4">
          ${isLoggedIn ? `
            ${isAdmin ? `<a href="javascript:void(0)" onclick="closeMobileMenu(); navigate('admin')" class="font-black text-secondary text-lg flex items-center gap-3"><i class="fa-solid fa-user-shield text-secondary"></i> Director's Console</a>` : ''}
            <a href="javascript:void(0)" onclick="closeMobileMenu(); navigate('my-complaints')" class="font-black text-primary text-lg flex items-center gap-3"><i class="fa-solid fa-clipboard-list text-primary"></i> Dashboard</a>
            <button onclick="closeMobileMenu(); handleLogout()" class="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-secondary hover:text-white transition-all">
              <i class="fa-solid fa-power-off"></i> Sign Out
            </button>
          ` : `
            <a href="javascript:void(0)" onclick="closeMobileMenu(); navigate('login')" class="font-black text-slate-900 hover:text-primary text-lg flex items-center gap-3"><i class="fa-solid fa-right-to-bracket text-slate-400"></i> Sign In</a>
            <button onclick="closeMobileMenu(); navigate('register')" class="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-3">
              <i class="fa-solid fa-user-plus"></i> Join Portal
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  // Attach Menu Toggle Listener
  const menuBtn = document.getElementById("mobile-menu-btn");
  const dropdown = document.getElementById("mobile-dropdown");
  if (menuBtn && dropdown) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = dropdown.classList.contains("hidden");
      if (isHidden) {
        dropdown.classList.remove("hidden");
        menuBtn.innerHTML = `<i class="fa-solid fa-xmark text-lg"></i>`;
      } else {
        dropdown.classList.add("hidden");
        menuBtn.innerHTML = `<i class="fa-solid fa-bars text-lg"></i>`;
      }
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
        dropdown.classList.add("hidden");
        menuBtn.innerHTML = `<i class="fa-solid fa-bars text-lg"></i>`;
      }
    });
  }
}

function closeMobileMenu() {
  const dropdown = document.getElementById("mobile-dropdown");
  const menuBtn = document.getElementById("mobile-menu-btn");
  if (dropdown) dropdown.classList.add("hidden");
  if (menuBtn) menuBtn.innerHTML = `<i class="fa-solid fa-bars text-lg"></i>`;
}


function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `fixed bottom-10 right-10 z-[1000] px-8 py-4 rounded-2xl font-black text-white shadow-2xl animate-slide-up flex items-center gap-4 ${type === 'success' ? 'bg-primary' : 'bg-secondary'}`;
  t.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'}"></i>
    ${msg}
  `;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3000);
}

function escapeHTML(str) {
  const p = document.createElement("p");
  p.textContent = str;
  return p.innerHTML;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Authentication ──────────────────────────────────────────

async function checkSession() {
  const token = localStorage.getItem("token");
  if (!token) { currentUser = null; navigate("home"); return; }
  try {
    currentUser = await api("/auth/me");
    navigate("home");
  } catch (err) {
    localStorage.removeItem("token");
    currentUser = null;
    navigate("home");
  }
}

async function handleLogout() {
  localStorage.removeItem("token");
  currentUser = null;
  showToast("Session Terminated Securely");
  navigate("home");
}

async function handleLogin() {
  clearError("login-error");
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  if (!email || !password) return showError("login-error", "Credentials Required");

  setLoading("login-btn", true);
  try {
    const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    localStorage.setItem("token", data.token);
    currentUser = { name: data.name, email: data.email, role: data.role };
    showToast(`Welcome back, ${data.name}`);
    navigate(data.role === "admin" ? "admin" : "my-complaints");
  } catch (err) { showError("login-error", err.message); }
  finally { setLoading("login-btn", false); }
}

function renderLoginPage(container) {
  container.innerHTML = `
    <div class="max-w-xl mx-auto py-12 px-6 page-fade-in">
      <div class="medical-card-bright p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-primary/30">
            <i class="fa-solid fa-fingerprint text-2xl"></i>
          </div>
          <h1 class="font-display text-4xl font-black text-slate-900 mb-2 tracking-tighter">Authority Access</h1>
          <p class="text-slate-500 text-sm font-medium">Citizen Dispatch Console</p>
        </div>
        <div id="login-error"></div>
        <div class="space-y-6">
          <div>
            <label class="form-label-bold text-primary">SECURE EMAIL ADDRESS</label>
            <input class="form-input-large" id="login-email" type="email" placeholder="official@agency.gov" />
          </div>
          <div>
            <label class="form-label-bold text-primary">ENCRYPTED PASSWORD</label>
            <input class="form-input-large" id="login-password" type="password" placeholder="••••••••" />
          </div>
          <button class="w-full btn-large bg-primary text-white shadow-2xl h-[60px] text-lg" id="login-btn" onclick="handleLogin()">Authorize Identity</button>
        </div>
        <div class="flex justify-between items-center mt-10 pt-6 border-t border-slate-50">
          <div class="text-xs text-slate-500 font-bold">
            New Citizen? <a href="javascript:void(0)" class="text-secondary font-black hover:underline" onclick="navigate('register')">Enroll in Network</a>
          </div>
          <div class="text-xs text-slate-500 font-bold">
            <i class="fa-solid fa-user-shield text-primary mr-1"></i>
            <a href="javascript:void(0)" class="text-primary font-black hover:underline" onclick="showAdminTip()">Director's Entrance</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showAdminTip() {
  showToast("Please enter administrative credentials above.", "success");
}

// ─── Registration Page ───────────────────────────────────────
function renderRegisterPage(container) {
  container.innerHTML = `
    <div class="max-w-xl mx-auto py-6 px-6 page-fade-in">
      <div class="text-center mb-6">
        <div class="inline-flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[8px] mb-1">Authority Network</div>
        <h1 class="font-display text-4xl font-black text-slate-900 mb-2 tracking-tighter">Citizen Enrollment</h1>
        <p class="text-slate-500 text-sm font-medium">Official UP Police Digital Cell</p>
      </div>

      <div class="flex items-center gap-4 mb-6 px-4 max-w-xs mx-auto">
        <div class="step-dot active" id="dot-1" style="width:32px; height:32px; font-size:0.9rem; font-weight:900;">1</div>
        <div class="step-line" style="height:4px;"><div class="step-line-active w-0" id="line-1"></div></div>
        <div class="step-dot" id="dot-2" style="width:32px; height:32px; font-size:0.9rem; font-weight:900;">2</div>
        <div class="step-line" style="height:4px;"><div class="step-line-active w-0" id="line-2"></div></div>
        <div class="step-dot" id="dot-3" style="width:32px; height:32px; font-size:0.9rem; font-weight:900;">3</div>
      </div>

      <div class="medical-card-bright p-6">
        <div id="register-step-1">
          <div id="reg-error-1"></div>
          <div class="space-y-6">
            <div><label class="form-label-bold">FULL LEGAL NAME</label><input class="form-input-large" id="reg-name" type="text" placeholder="Aadhar/ID Name" /></div>
            <div><label class="form-label-bold">SECURE EMAIL ADDRESS</label><input class="form-input-large" id="reg-email" type="email" placeholder="citizen@email.com" /></div>
            <button class="w-full btn-large bg-primary text-white shadow-2xl h-[60px]" id="reg-send-otp-btn" onclick="handleSendOtp()">Initialize Verification</button>
          </div>
        </div>
        <div class="hidden" id="register-step-2">
          <div id="reg-error-2"></div>
          <div class="text-center mb-8">
            <p class="text-slate-500 text-sm font-medium">Dispatching code to</p>
            <p class="font-black text-slate-900 text-lg tracking-tight" id="reg-email-display"></p>
          </div>
          <div class="grid grid-cols-6 gap-3 mb-8">
            ${[0,1,2,3,4,5].map(i => `<input class="otp-cell" type="text" maxlength="1" id="otp-${i}" style="height:50px;" aria-label="OTP Digit ${i + 1}" />`).join("")}
          </div>
          <button class="w-full btn-large bg-primary text-white shadow-2xl h-[60px]" id="reg-verify-otp-btn" onclick="handleVerifyOtpStep()">Verify Credentials</button>
        </div>
        <div class="hidden" id="register-step-3">
          <div id="reg-error-3"></div>
          <div class="space-y-6">
            <div><label class="form-label-bold">AUTHORITY PASSWORD</label><input class="form-input-large" id="reg-password" type="password" placeholder="••••••••" /></div>
            <div><label class="form-label-bold">CONFIRM PASSWORD</label><input class="form-input-large" id="reg-confirm" type="password" placeholder="••••••••" /></div>
            <button class="w-full btn-large bg-primary text-white shadow-2xl h-[60px]" id="reg-complete-btn" onclick="handleRegister()">Authorize Enrollment</button>
          </div>
        </div>
      </div>
    </div>
  `;
  setTimeout(setupOtpInputs, 0);
}

let regEmail = "";
function setupOtpInputs() {
  const inputs = document.querySelectorAll("#otp-0, #otp-1, #otp-2, #otp-3, #otp-4, #otp-5");
  inputs.forEach((input, i) => {
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && i > 0) inputs[i - 1].focus();
    });
    input.addEventListener("paste", (e) => {
      const data = e.clipboardData.getData("text").trim();
      if (data.length === 6 && /^\d+$/.test(data)) {
        data.split("").forEach((char, idx) => {
          if (inputs[idx]) inputs[idx].value = char;
        });
        inputs[5].focus();
      }
      e.preventDefault();
    });
  });
}

async function handleSendOtp() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  if (!name || !email) return showError("reg-error-1", "Identity data required");
  setLoading("reg-send-otp-btn", true);
  try {
    await api("/auth/send-otp", { method: "POST", body: JSON.stringify({ name, email }) });
    regEmail = email;
    document.getElementById("reg-email-display").textContent = email;
    document.getElementById("register-step-1").classList.add("hidden");
    document.getElementById("register-step-2").classList.remove("hidden");
    updateStepper(2);
    showToast("Authentication code dispatched");
  } catch (err) { showError("reg-error-1", err.message); }
  finally { setLoading("reg-send-otp-btn", false); }
}

async function handleVerifyOtpStep() {
  clearError("reg-error-2");
  let otp = "";
  for (let i = 0; i < 6; i++) otp += document.getElementById(`otp-${i}`).value;
  if (otp.length !== 6) return showError("reg-error-2", "Incomplete code");

  setLoading("reg-verify-otp-btn", true);
  try {
    await api("/auth/verify-otp", { 
      method: "POST", 
      body: JSON.stringify({ email: regEmail, otp }) 
    });
    window._regOtp = otp;
    document.getElementById("register-step-2").classList.add("hidden");
    document.getElementById("register-step-3").classList.remove("hidden");
    updateStepper(3);
    showToast("Identity Verified Successfully");
  } catch (err) {
    showError("reg-error-2", err.message);
  } finally {
    setLoading("reg-verify-otp-btn", false);
  }
}

async function handleRegister() {
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  if (password !== confirm) return showError("reg-error-3", "Passwords mismatch");
  setLoading("reg-complete-btn", true);
  try {
    await api("/auth/register", { method: "POST", body: JSON.stringify({ email: regEmail, otp: window._regOtp, password }) });
    showToast("Enrollment successful. Access granted.");
    navigate("login");
  } catch (err) { showError("reg-error-3", err.message); }
  finally { setLoading("reg-complete-btn", false); }
}

function updateStepper(active) {
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (dot) {
      dot.classList.toggle("active", i === active);
      dot.classList.toggle("done", i < active);
    }
  }
}

// ─── Grievance Submission ────────────────────────────────────
function renderSubmitPage(container) {
  container.innerHTML = `
    <div class="max-w-5xl mx-auto py-12 px-6 page-fade-in">
      <div class="text-center mb-10">
        <h1 class="font-display text-5xl font-black text-slate-900 mb-4 tracking-tighter">Submit Incident Report</h1>
        <p class="text-slate-500 text-lg font-medium">Our Intelligence Analysis Unit will guide your submission.</p>
      </div>
      <div class="medical-card-bright p-10">
        <div id="submit-error"></div>
        <div class="space-y-8">
          <div><label class="form-label-bold">OFFICIAL INCIDENT STATEMENT</label><textarea class="form-input-large min-h-[160px]" id="complaint-text"></textarea></div>
          <button class="w-full btn-large bg-slate-900 text-white" id="get-ai-btn" onclick="handleGetAIQuestion()">Initialize Intelligence Triage</button>
          <div class="hidden space-y-8 pt-8 border-t-2 border-slate-50" id="ai-section">
            <div class="bg-primary/5 p-8 rounded-[32px]"><div class="text-2xl font-black text-slate-900" id="ai-question-display"></div></div>
            <div><label class="form-label-bold">SUPPLEMENTARY EVIDENCE</label><textarea class="form-input-large min-h-[120px]" id="ai-answer"></textarea></div>
            <button class="w-full btn-large bg-primary text-white" id="submit-complaint-btn" onclick="handleSubmitComplaint()">Authorize Dispatch</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

let aiQuestion = "";
async function handleGetAIQuestion() {
  const text = document.getElementById("complaint-text").value.trim();
  if (!text) return showError("submit-error", "Incident details required");
  setLoading("get-ai-btn", true);
  try {
    const data = await api("/ai/question", { method: "POST", body: JSON.stringify({ complaint_text: text }) });
    aiQuestion = data.question;
    document.getElementById("ai-question-display").textContent = data.question;
    document.getElementById("ai-section").classList.remove("hidden");
  } catch (err) { showError("submit-error", err.message); }
  finally { setLoading("get-ai-btn", false); }
}

async function handleSubmitComplaint() {
  const complaint_text = document.getElementById("complaint-text").value.trim();
  const ai_answer = document.getElementById("ai-answer").value.trim();
  setLoading("submit-complaint-btn", true);
  try {
    await api("/complaints", { method: "POST", body: JSON.stringify({ complaint_text, ai_question: aiQuestion, ai_answer }) });
    showToast("Dispatch authorized successfully");
    navigate("my-complaints");
  } catch (err) { showError("submit-error", err.message); }
  finally { setLoading("submit-complaint-btn", false); }
}

// ─── Citizen Dashboard ───────────────────────────────────────
async function renderMyComplaintsPage(container) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto py-12 sm:py-24 px-4 sm:px-6 page-fade-in">
      <div class="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end mb-10 sm:mb-16">
        <div><h1 class="font-display text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">Citizen Command Center</h1></div>
        <button class="w-full sm:w-auto bg-primary text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-black text-center shadow-lg hover:scale-105 active:scale-95 transition-all" onclick="navigate('submit')">+ File New Incident</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 mb-10 sm:mb-16">
        <div class="medical-card-bright p-6 sm:p-10 font-bold text-slate-500">Total Incidents: <span id="dash-stat-total" class="block font-black text-slate-900 text-3xl sm:text-4xl mt-2">0</span></div>
        <div class="medical-card-bright p-6 sm:p-10 font-bold text-slate-500">Active Cases: <span id="dash-stat-pending" class="block font-black text-secondary text-3xl sm:text-4xl mt-2">0</span></div>
        <div class="medical-card-bright p-6 sm:p-10 font-bold text-slate-500">Resolved Files: <span id="dash-stat-resolved" class="block font-black text-success text-3xl sm:text-4xl mt-2">0</span></div>
      </div>
      <div class="bg-white rounded-[24px] sm:rounded-[48px] shadow-2xl overflow-hidden" id="my-complaints-list">
        <div class="p-16 sm:p-32 text-center"><div class="spinner mx-auto mb-8"></div><p>Synchronizing Databases...</p></div>
      </div>
    </div>
  `;
  try {
    const data = await api("/complaints/my");
    const stats = { total: data.complaints.length, pending: 0, resolved: 0 };
    data.complaints.forEach(c => c.status === 'resolved' ? stats.resolved++ : stats.pending++);
    document.getElementById("dash-stat-total").innerText = stats.total;
    document.getElementById("dash-stat-pending").innerText = stats.pending;
    document.getElementById("dash-stat-resolved").innerText = stats.resolved;
    renderComplaintsTable(document.getElementById("my-complaints-list"), data.complaints);
  } catch (err) { document.getElementById("my-complaints-list").innerHTML = `<div class="p-12 text-center text-secondary">${err.message}</div>`; }
}

function renderComplaintsTable(container, complaints) {
  if (complaints.length === 0) {
    container.innerHTML = `<div class="p-20 text-center"><p class="text-slate-400 font-black mb-4 uppercase">No Incident Records</p></div>`;
    return;
  }
  container.innerHTML = `
    <table class="w-full">
      <thead><tr class="bg-slate-50 text-left"><th class="px-8 py-4">ID</th><th class="px-8 py-4">Incident</th><th class="px-8 py-4">Status</th><th class="px-8 py-4"></th></tr></thead>
      <tbody class="divide-y divide-slate-100">
        ${complaints.map(c => `
          <tr class="hover:bg-primary/5 transition-all">
            <td class="px-8 py-6 font-black text-primary" data-label="ID">#${c.id.slice(0,8).toUpperCase()}</td>
            <td class="px-8 py-6 font-bold truncate max-w-[300px]" data-label="Incident">${escapeHTML(c.complaint_text)}</td>
            <td class="px-8 py-6 text-left sm:text-center" data-label="Status"><span class="px-4 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}">${c.status}</span></td>
            <td class="px-8 py-6 text-right flex justify-end gap-2" data-label="Action"><button onclick="showIncidentDetailsModal('${c.id}')" class="text-primary font-black"><i class="fa-solid fa-arrow-right"></i></button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function showIncidentDetailsModal(id) {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-[2000] bg-slate-900/90 overflow-y-auto p-4 sm:p-6 flex justify-center items-start sm:items-center";
  modal.id = "incident-modal";
  modal.innerHTML = `<div class="medical-card-bright p-10 text-center w-full max-w-xl my-8"><div class="spinner mx-auto mb-6"></div><p class="font-black">Retrieving Official Dossier...</p></div>`;
  document.body.appendChild(modal);

  try {
    const data = await api(`/complaints/${id}`);
    const c = data.complaint;
    
    if (!c) throw new Error("Incomplete dossier record received.");

    modal.innerHTML = `
      <div class="medical-card-bright p-6 sm:p-10 max-w-2xl w-full page-fade-in relative overflow-hidden my-8">
        <div class="absolute top-0 left-0 w-full h-2 bg-primary"></div>
        <div class="flex justify-between items-start mb-8">
          <div>
            <div class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Case ID: #${(c.id || "UNKNOWN").toUpperCase()}</div>
            <h2 class="text-3xl font-black tracking-tighter">Investigation Dossier</h2>
          </div>
          <button onclick="document.getElementById('incident-modal').remove()" class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-secondary transition-all">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar pr-4">
          <div class="bg-slate-50 p-6 rounded-[24px]">
            <label class="form-label-bold text-[8px]">Incident Statement</label>
            <p class="text-lg font-bold text-slate-700 leading-relaxed">${escapeHTML(c.complaint_text || "No statement recorded.")}</p>
          </div>

          ${c.ai_question ? `
            <div class="border-l-4 border-secondary pl-6 space-y-4">
              <div class="bg-secondary/5 p-6 rounded-[24px]">
                <label class="form-label-bold text-[8px] text-secondary">Authority Triage Question</label>
                <p class="text-base font-black italic">"${escapeHTML(c.ai_question)}"</p>
              </div>
              <div class="bg-slate-50 p-6 rounded-[24px]">
                <label class="form-label-bold text-[8px]">Citizen Response</label>
                <p class="text-base font-bold text-slate-500">${escapeHTML(c.user_answer || "N/A")}</p>
              </div>
            </div>
          ` : ''}

          ${c.status === 'resolved' ? `
            <div class="bg-primary text-white p-8 rounded-[32px] shadow-2xl shadow-primary/20">
              <label class="form-label-bold text-[8px] text-white/50">Official Authority Resolution</label>
              <p class="text-xl font-black italic leading-relaxed">"${escapeHTML(c.resolution_text || "Case resolved by administrative order.")}"</p>
              <div class="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary bg-white/10 px-4 py-2 rounded-full w-fit">
                <i class="fa-solid fa-check-double"></i> Case Closed
              </div>
            </div>
          ` : `
            <div class="flex items-center gap-4 p-6 bg-orange-50 rounded-[24px] border border-orange-100">
               <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center animate-pulse"><i class="fa-solid fa-clock-rotate-left"></i></div>
               <div>
                  <div class="text-sm font-black text-orange-900">Current Status: ${(c.status || "PENDING").toUpperCase()}</div>
                  <div class="text-[10px] font-bold text-orange-600 uppercase">Awaiting further investigation</div>
               </div>
            </div>
          `}
        </div>

        <div class="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
           <div>Filed: ${formatDate(c.created_at)}</div>
           <div class="flex items-center gap-2"><i class="fa-solid fa-shield-halved"></i> UP Police Secure</div>
        </div>
      </div>
    `;
  } catch (err) {
    modal.innerHTML = `<div class="medical-card-bright p-10 text-center w-full max-w-xl"><p class="text-secondary font-black mb-6">${err.message}</p><button onclick="document.getElementById('incident-modal').remove()" class="btn-large bg-primary text-white w-full">Dismiss</button></div>`;
  }
}

// ─── Investigation Tracker ───────────────────────────────────
async function renderTrackPage(container, id) {
  container.innerHTML = `<div class="p-32 text-center"><div class="spinner mx-auto mb-8"></div><p>Retrieving Official Record...</p></div>`;
  try {
    const c = await api(`/complaints/${id}`);
    const steps = [
      { label: "Dispatch Recorded", icon: "fa-file-signature", active: true },
      { label: "Case Triage", icon: "fa-user-shield", active: true },
      { label: "Investigation Bureau", icon: "fa-magnifying-glass", active: c.status !== 'pending' },
      { label: "Authority Resolution", icon: "fa-handcuffs", active: c.status === 'resolved' }
    ];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-12 px-6 page-fade-in">
        <div class="medical-card-bright p-10 bg-slate-900 text-white mb-10">
          <div class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Case Identity: #${c.id.toUpperCase()}</div>
          <h1 class="text-4xl font-black mb-6 tracking-tighter">Investigation Timeline</h1>
          <div class="flex justify-between relative pt-8 pb-4">
            <div class="absolute top-[48px] left-0 w-full h-1 bg-white/10"></div>
            ${steps.map(s => `
              <div class="relative z-10 flex flex-col items-center gap-4">
                <div class="w-10 h-10 ${s.active ? 'bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/10'} rounded-full flex items-center justify-center border-2 border-slate-900">
                  <i class="fa-solid ${s.icon} text-xs"></i>
                </div>
                <div class="text-[8px] font-black uppercase tracking-widest ${s.active ? 'text-white' : 'text-white/30'}">${s.label}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-10">
          <div class="lg:col-span-2 space-y-10">
            <div class="medical-card-bright p-10">
              <h3 class="text-xl font-black text-slate-900 mb-6 tracking-tight">Dispatch Summary</h3>
              <p class="text-lg font-bold text-slate-500 leading-relaxed mb-8 truncate-3-lines">${escapeHTML(c.complaint_text)}</p>
              ${c.ai_question ? `
                <div class="bg-slate-50 p-8 rounded-[32px] border-l-4 border-primary">
                  <div class="text-[8px] font-black text-primary uppercase tracking-widest mb-3">Authority Follow-up</div>
                  <p class="text-base font-black text-slate-900 italic">"${escapeHTML(c.ai_question)}"</p>
                  <div class="mt-4 text-base font-bold text-slate-500">${escapeHTML(c.ai_answer || "Awaiting intelligence...")}</div>
                </div>
              ` : ''}
            </div>
          </div>
          <div>
             <div class="medical-card-bright p-8 mb-6"><div class="text-[10px] font-black text-slate-400 mb-1 uppercase">Status</div><div class="text-xl font-black text-primary uppercase">${c.status}</div></div>
             <div class="medical-card-bright p-8"><div class="text-[10px] font-black text-slate-400 mb-1 uppercase">Dispatch Date</div><div class="text-lg font-bold">${formatDate(c.created_at)}</div></div>
          </div>
        </div>
      </div>
    `;
  } catch (err) { container.innerHTML = `<div class="p-12 text-center text-secondary">${err.message}</div>`; }
}

// ─── Authority Pages ──────────────────────────────────────────
function renderDepartmentsPage(container) {
  const units = [
    { name: "Cyber Crime Wing", desc: "Specialized unit for investigation of hacking and digital fraud.", icon: "fa-binary" },
    { name: "Anti-Terrorist Squad", desc: "Elite unit for counter-terrorism operations.", icon: "fa-shield-halved" },
    { name: "Women Power Line 1090", desc: "24x7 specialized wing for women security.", icon: "fa-person-dress" }
  ];
  container.innerHTML = `
    <div class="max-w-7xl mx-auto py-24 px-6 page-fade-in">
      <div class="text-center mb-20"><h1 class="font-display text-6xl font-black text-slate-900 tracking-tighter">Authority Units</h1></div>
      <div class="grid md:grid-cols-3 gap-10">
        ${units.map(u => `<div class="medical-card-bright p-10"><div class="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8"><i class="fa-solid ${u.icon} text-2xl"></i></div><h3 class="text-2xl font-black mb-4">${u.name}</h3><p class="text-slate-500 font-medium mb-8">${u.desc}</p><button onclick="navigate('submit')" class="text-primary font-black uppercase text-xs">File Dispatch →</button></div>`).join('')}
      </div>
    </div>
  `;
}

function renderContactPage(container) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto py-12 px-6 page-fade-in">
      <h1 class="font-display text-5xl font-black text-slate-900 mb-8 tracking-tighter">Direct Command</h1>
      <div class="grid lg:grid-cols-2 gap-16">
        <div class="space-y-8">
          <div class="flex items-center gap-6"><div class="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><i class="fa-solid fa-phone"></i></div><div class="text-xl font-black">Emergency: 112</div></div>
          <div class="flex items-center gap-6"><div class="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><i class="fa-solid fa-building"></i></div><div class="text-xl font-black">Official HQ: 0522-2390314</div></div>
        </div>
        <div class="medical-card-bright p-10 bg-primary text-white">
          <h3 class="text-3xl font-black mb-6">Inquiry Desk</h3>
          <p class="text-white/60 font-bold mb-8">Secure channel for official administrative queries.</p>
          <button onclick="showContactModal()" class="btn-large bg-white text-primary w-full shadow-2xl">Send Message</button>
        </div>
      </div>
    </div>
  `;
}

function showContactModal() {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-[2000] bg-slate-900/90 overflow-y-auto p-4 sm:p-6 flex justify-center items-start sm:items-center";
  modal.id = "contact-modal";
  modal.innerHTML = `
    <div class="medical-card-bright p-6 sm:p-10 max-w-xl w-full page-fade-in my-8">
      <h3 class="text-3xl font-black mb-8 tracking-tight">Official Inquiry Dispatch</h3>
      <div id="contact-error"></div>
      <div class="space-y-6 mb-8">
        <div><label class="form-label-bold">CITIZEN NAME</label><input id="contact-name" class="form-input-large" placeholder="Enter Full Name" /></div>
        <div><label class="form-label-bold">IDENTITY EMAIL</label><input id="contact-email" class="form-input-large" placeholder="citizen@email.com" /></div>
        <div><label class="form-label-bold">OFFICIAL QUERY</label><textarea id="contact-query" class="form-input-large min-h-[120px]" placeholder="Type your query here..."></textarea></div>
      </div>
      <div class="flex gap-4">
        <button onclick="document.getElementById('contact-modal').remove()" class="btn-large flex-1 bg-slate-100 text-slate-500 font-black">Cancel</button>
        <button id="contact-submit-btn" onclick="handleContactSubmit()" class="btn-large flex-1 bg-primary text-white font-black shadow-2xl shadow-primary/30">Submit Dispatch</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function handleContactSubmit() {
  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const query = document.getElementById("contact-query").value.trim();
  
  if (!name || !email || !query) return showError("contact-error", "All fields are required.");
  
  setLoading("contact-submit-btn", true);
  try {
    await api("/auth/contact", { method: "POST", body: JSON.stringify({ name, email, query }) });
    showToast("Inquiry sent to admin successfully.");
    document.getElementById("contact-modal").remove();
  } catch (err) {
    showError("contact-error", err.message);
  } finally {
    setLoading("contact-submit-btn", false);
  }
}

// ─── Admin Dashboard ──────────────────────────────────────────
async function renderAdminDashboard(container) {
  container.innerHTML = `<div class="p-16 sm:p-32 text-center"><div class="spinner mx-auto mb-8"></div><p>Loading Director's Console...</p></div>`;
  try {
    const data = await api("/admin/complaints");
    container.innerHTML = `
      <div class="max-w-7xl mx-auto py-12 sm:py-24 px-4 sm:px-6 page-fade-in">
        <div class="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end mb-10 sm:mb-16">
          <div><h1 class="font-display text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">Director's Console</h1></div>
          <div class="w-full sm:w-auto flex gap-4"><button onclick="renderUserManagement()" class="w-full sm:w-auto bg-secondary text-white px-8 py-4 rounded-xl font-black text-center shadow-lg hover:scale-105 active:scale-95 transition-all">User Records</button></div>
        </div>
        <div class="bg-white rounded-[24px] sm:rounded-[48px] shadow-2xl overflow-hidden" id="admin-complaints-list"></div>
      </div>
    `;
    renderAdminComplaints(document.getElementById("admin-complaints-list"), data.complaints);
  } catch (err) { container.innerHTML = `<div class="p-12 text-center text-secondary">${err.message}</div>`; }
}

function renderAdminComplaints(container, complaints) {
  container.innerHTML = `
    <table class="w-full">
      <thead><tr class="bg-slate-50 text-left"><th class="px-12 py-6">ID</th><th class="px-12 py-6">Citizen</th><th class="px-12 py-6">Status</th><th class="px-12 py-6 text-right">Action</th></tr></thead>
      <tbody class="divide-y divide-slate-100">
        ${complaints.map(c => `
          <tr class="hover:bg-primary/5 transition-all">
            <td class="px-12 py-8 font-black text-primary" data-label="ID">#${c.id.slice(0,8).toUpperCase()}</td>
            <td class="px-12 py-8 font-bold" data-label="Citizen">${escapeHTML(c.user_name)}</td>
            <td class="px-12 py-8" data-label="Status">
              <span class="px-4 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'resolved' ? 'bg-green-50 text-green-600' : c.status === 'investigating' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}">
                ${c.status}
              </span>
            </td>
            <td class="px-12 py-8 text-right flex justify-end gap-4" data-label="Command">
              ${c.status === 'resolved' ? `
                <button onclick="handleReopenComplaint('${c.id}')" class="text-secondary font-black text-xs uppercase hover:underline">Reopen</button>
              ` : ''}
              <button onclick="showResolutionModal('${c.id}', '${escapeHTML(c.resolution_text || "")}', '${c.status}')" class="text-primary font-black uppercase text-xs">Dispatch</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function handleStatusUpdate(id, status) {
  try {
    await api(`/admin/complaints/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    showToast("Case Status Updated Officialy");
  } catch (err) { showToast(err.message, "error"); }
}

function showResolutionModal(id, currentText, currentStatus) {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-[2000] bg-slate-900/90 overflow-y-auto p-4 sm:p-6 flex justify-center items-start sm:items-center";
  modal.id = "resolution-modal";
  modal.innerHTML = `
    <div class="medical-card-bright p-6 sm:p-10 max-w-2xl w-full page-fade-in relative my-8">
      <div class="flex justify-between items-center mb-8">
        <h3 class="text-3xl font-black tracking-tight">Official Dispatch Bureau</h3>
        <div id="ai-indicator" class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full">
           <div class="w-2 h-2 bg-primary rounded-full animate-ping"></div> AI Intelligence Drafting...
        </div>
      </div>
      <div id="res-error"></div>
      
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label class="form-label-bold text-[8px]">Investigation Status</label>
          <select id="modal-status" class="form-input-large" style="padding:0.75rem 1rem;">
            <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="investigating" ${currentStatus === 'investigating' ? 'selected' : ''}>Investigating</option>
            <option value="resolved" ${currentStatus === 'resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>
        <div>
          <label class="form-label-bold text-[8px]">Case Identity</label>
          <div class="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-black text-slate-400">#${id.slice(0,8).toUpperCase()}</div>
        </div>
      </div>

      <label class="form-label-bold text-[8px]">Official Resolution / Instructions</label>
      <textarea id="modal-resolution" class="form-input-large min-h-[160px] mb-8" placeholder="AI is analyzing incident data and drafting resolution...">${currentText}</textarea>
      
      <div class="flex gap-4">
        <button onclick="document.getElementById('resolution-modal').remove()" class="btn-large flex-1 bg-slate-100 text-slate-500 font-black">Cancel</button>
        <button id="res-submit-btn" onclick="handleIntegratedDispatch('${id}')" class="btn-large flex-2 bg-primary text-white font-black shadow-xl shadow-primary/30">Submit Official Dispatch</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Auto-trigger AI if resolving or investigating
  getAIResolutionSuggestion(id);
}

async function handleIntegratedDispatch(id) {
  const status = document.getElementById("modal-status").value;
  const text = document.getElementById("modal-resolution").value;
  
  if (status === 'resolved' && !text) return showError("res-error", "Resolution statement required for case closure.");
  
  setLoading("res-submit-btn", true);
  try {
    // 1. Update Status
    await api(`/admin/complaints/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    
    // 2. Update Resolution (if provided or status is resolved)
    if (text || status === 'resolved') {
      await api(`/admin/complaints/${id}/resolve`, { method: "PATCH", body: JSON.stringify({ resolution_text: text }) });
    }
    
    showToast("Official Dispatch Transmitted Successfully");
    document.getElementById('resolution-modal').remove();
    navigate("admin");
  } catch (err) { showError("res-error", err.message); }
  finally { setLoading("res-submit-btn", false); }
}

async function handleReopenComplaint(id) {
  if (!confirm("Authorize Investigation Reopening?")) return;
  try {
    await api(`/admin/complaints/${id}/reopen`, { method: "PATCH" });
    showToast("Case Investigation Reopened Officialy");
    navigate("admin");
  } catch (err) { showToast(err.message, "error"); }
}

async function getAIResolutionSuggestion(id) {
  const indicator = document.getElementById("ai-indicator");
  const textarea = document.getElementById("modal-resolution");
  if (!indicator || !textarea) return;

  indicator.classList.remove("hidden");
  textarea.value = "";
  
  try {
    const data = await api(`/admin/complaints/${id}/ai-suggest`, { method: "POST" });
    indicator.classList.add("hidden");
    await typeWriter(textarea, data.suggestion);
    showToast("AI Intelligence Triage Completed", "success");
  } catch (err) {
    indicator.classList.add("hidden");
    textarea.placeholder = "Type official resolution...";
    showToast("Intelligence Triage Failed", "error");
  }
}

function typeWriter(element, text, speed = 15) {
  return new Promise(resolve => {
    let i = 0;
    function type() {
      if (i < text.length) {
        element.value += text.charAt(i);
        i++;
        element.scrollTop = element.scrollHeight;
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    type();
  });
}

// ─── Init ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  checkSession();
});

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="bg-secondary/10 text-secondary p-6 rounded-2xl font-black mb-10 border border-secondary/20">${msg}</div>`;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = "";
}

function setLoading(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) btn.dataset.orig = btn.innerHTML, btn.innerHTML = "Processing Authority Data...";
  else btn.innerHTML = btn.dataset.orig;
}

// ─── User Management ─────────────────────────────────────────

async function renderUserManagement() {
  const mainView = document.getElementById("main-view");
  mainView.innerHTML = `
    <div class="max-w-7xl mx-auto py-12 sm:py-24 px-4 sm:px-6 page-fade-in">
      <div class="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end mb-10 sm:mb-16">
        <div>
          <div class="inline-flex items-center gap-2 text-secondary font-black uppercase tracking-[0.2em] text-xs mb-4">Director's Bureau</div>
          <h1 class="font-display text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">Personnel Archives</h1>
        </div>
        <button onclick="showCreateUserModal()" class="w-full sm:w-auto bg-primary text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-black shadow-2xl text-center hover:scale-105 active:scale-95 transition-all">+ Provision Account</button>
      </div>
      <div class="bg-white rounded-[24px] sm:rounded-[48px] shadow-2xl overflow-hidden" id="user-list-container">
        <div class="p-16 sm:p-32 text-center"><div class="spinner mx-auto mb-8"></div><p>Synchronizing Personnel Records...</p></div>
      </div>
    </div>
  `;

  try {
    const data = await api("/admin/users");
    const container = document.getElementById("user-list-container");
    container.innerHTML = `
      <table class="w-full">
        <thead><tr class="bg-slate-50 text-left"><th class="px-12 py-6">Official Name</th><th class="px-12 py-6">Credentials</th><th class="px-12 py-6">Designation</th><th class="px-12 py-6 text-right">Action</th></tr></thead>
        <tbody class="divide-y divide-slate-100">
          ${data.users.map(u => `
            <tr class="hover:bg-secondary/5 transition-all">
              <td class="px-12 py-8 font-black text-slate-900" data-label="Official">${escapeHTML(u.name)}</td>
              <td class="px-12 py-8 font-bold text-slate-500" data-label="Email">${escapeHTML(u.email)}</td>
              <td class="px-12 py-8" data-label="Role"><span class="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-500'}">${u.role}</span></td>
              <td class="px-12 py-8 text-right flex justify-end gap-4" data-label="Action">
                <button onclick="showEditUserModal('${u.id}', '${escapeHTML(u.name)}', '${u.role}')" class="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-all flex items-center justify-center"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="handleDeleteUser('${u.id}')" class="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-secondary transition-all flex items-center justify-center"><i class="fa-solid fa-trash-can"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) { showError("user-list-container", err.message); }
}

function showCreateUserModal() {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-[2000] bg-slate-900/90 overflow-y-auto p-4 sm:p-6 flex justify-center items-start sm:items-center";
  modal.innerHTML = `
    <div class="medical-card-bright p-6 sm:p-10 max-w-2xl w-full my-8">
      <h3 class="text-3xl font-black mb-8 sm:mb-10 tracking-tight">Provision New Account</h3>
      <div class="space-y-6 sm:space-y-8 mb-8 sm:mb-10">
        <div><label class="form-label-bold">FULL NAME</label><input id="mu-name" class="form-input-large" /></div>
        <div><label class="form-label-bold">SECURE EMAIL</label><input id="mu-email" class="form-input-large" /></div>
        <div><label class="form-label-bold">ACCESS PASSWORD</label><input id="mu-pass" type="password" class="form-input-large" /></div>
        <div><label class="form-label-bold">DESIGNATION ROLE</label><select id="mu-role" class="form-input-large"><option value="user">Citizen User</option><option value="admin">Police Admin</option></select></div>
      </div>
      <div class="flex gap-4">
        <button onclick="this.closest('.fixed').remove()" class="btn btn-ghost font-black flex-1">Cancel</button>
        <button onclick="handleCreateUser()" class="btn btn-primary font-black px-8 sm:px-12 h-[60px] flex-2">Create Profile</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function handleCreateUser() {
  const name = document.getElementById("mu-name").value;
  const email = document.getElementById("mu-email").value;
  const password = document.getElementById("mu-pass").value;
  const role = document.getElementById("mu-role").value;
  try {
    await api("/admin/users", { method: "POST", body: JSON.stringify({ name, email, password, role }) });
    showToast("Profile Provisioned Successfully");
    document.querySelector('.fixed.inset-0').remove();
    renderUserManagement();
  } catch (err) { showToast(err.message, "error"); }
}

function showEditUserModal(id, name, role) {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-[2000] bg-slate-900/90 overflow-y-auto p-4 sm:p-6 flex justify-center items-start sm:items-center";
  modal.innerHTML = `
    <div class="medical-card-bright p-6 sm:p-10 max-w-xl w-full my-8">
      <h3 class="text-3xl font-black mb-8 sm:mb-10 tracking-tight">Modify Personnel Profile</h3>
      <div class="space-y-6 sm:space-y-8 mb-8 sm:mb-10">
        <div><label class="form-label-bold">FULL NAME</label><input id="eu-name" value="${name}" class="form-input-large" /></div>
        <div><label class="form-label-bold">DESIGNATION</label><select id="eu-role" class="form-input-large"><option value="user" ${role === 'user' ? 'selected' : ''}>Citizen User</option><option value="admin" ${role === 'admin' ? 'selected' : ''}>Police Admin</option></select></div>
      </div>
      <div class="flex gap-4">
        <button onclick="this.closest('.fixed').remove()" class="btn btn-ghost font-black flex-1">Cancel</button>
        <button onclick="handleEditUser('${id}')" class="btn btn-primary font-black px-8 sm:px-12 h-[60px] flex-2">Save Changes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function handleEditUser(id) {
  const name = document.getElementById("eu-name").value;
  const role = document.getElementById("eu-role").value;
  try {
    await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ name, role }) });
    showToast("Personnel Data Correction Applied");
    document.querySelector('.fixed.inset-0').remove();
    renderUserManagement();
  } catch (err) { showToast(err.message, "error"); }
}

async function handleDeleteUser(id) {
  if (!confirm("Authorize Access Revocation?")) return;
  try {
    await api(`/admin/users/${id}`, { method: "DELETE" });
    showToast("Access Revoked Successfully");
    renderUserManagement();
  } catch (err) { showToast(err.message, "error"); }
}
