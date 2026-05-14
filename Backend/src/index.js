require("dotenv").config();

// Force IPv4 DNS resolution
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Basic Middleware
app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    console.log(`⏰ Request Timeout: ${req.method} ${req.url}`);
    if (!res.headersSent) res.status(408).json({ error: "Request timed out" });
  });
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// --- IMPORTANT: API ROUTES FIRST ---
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", complaintRoutes);

// --- STATIC FILES SECOND ---
app.use(express.static(path.join(__dirname, "../../Frontend")));

// --- FALLBACK LAST ---
// Handle SPA routing and 404s for API
app.use((req, res) => {
  // If it's a GET request and NOT an API call, serve the frontend
  if (req.method === "GET" && !req.originalUrl.startsWith("/api")) {
    return res.sendFile(path.join(__dirname, "../../Frontend/index.html"));
  }
  
  // Otherwise, it's a 404 for an API or non-GET request
  res.status(404).json({ 
    error: "Not Found",
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
