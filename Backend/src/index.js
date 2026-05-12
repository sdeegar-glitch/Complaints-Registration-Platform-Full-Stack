require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../../Frontend")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", complaintRoutes);

// Fallback: serve index.html for any non-API route
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../../Frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
