// Basket Buddy — Phase 2 prototype server
// Demonstrates the actual pattern a real product needs: a persistent server
// holding a cache, instant reads for every visitor, and an explicit refresh
// step (a background job) instead of running webcmd live on every click.

const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3001;
const CACHE_FILE = path.join(__dirname, "cache.json");

let isRefreshing = false;
let lastRefreshLog = [];

app.use(express.static(path.join(__dirname, "public")));

function readCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

// GET /api/data — same shape the frontend already expects: {product: {platform: [items]}}
app.get("/api/data", (req, res) => {
  res.json(readCache());
});

// GET /api/status — cache freshness, so the UI can show "updated 12 min ago"
// instead of pretending every result is live
app.get("/api/status", (req, res) => {
  const cache = readCache();
  const products = Object.keys(cache);
  let lastRefreshed = null;
  if (fs.existsSync(CACHE_FILE)) {
    lastRefreshed = fs.statSync(CACHE_FILE).mtime;
  }
  const ageMinutes = lastRefreshed ? Math.round((Date.now() - new Date(lastRefreshed)) / 60000) : null;
  res.json({
    products,
    productCount: products.length,
    lastRefreshed,
    ageMinutes,
    isRefreshing,
    log: lastRefreshLog.slice(-15),
  });
});

// POST /api/refresh — triggers the background job that actually calls webcmd.
// This is the ONE place live browser work happens, never on a per-visitor request.
app.post("/api/refresh", (req, res) => {
  if (isRefreshing) {
    return res.status(409).json({ ok: false, message: "A refresh is already running." });
  }
  isRefreshing = true;
  lastRefreshLog = [`[${new Date().toISOString()}] refresh started`];

  const child = spawn("node", [path.join(__dirname, "refresh_cache.js")]);

  child.stdout.on("data", (d) => lastRefreshLog.push(d.toString().trim()));
  child.stderr.on("data", (d) => lastRefreshLog.push("ERROR: " + d.toString().trim()));

  child.on("close", (code) => {
    isRefreshing = false;
    lastRefreshLog.push(`[${new Date().toISOString()}] refresh finished, exit code ${code}`);
  });

  res.json({ ok: true, message: "Refresh started in the background. Poll /api/status." });
});

app.listen(PORT, () => {
  console.log(`Basket Buddy server running: http://localhost:${PORT}`);
  console.log(`Serving cached data from: ${CACHE_FILE}`);
  console.log(`Cache currently has ${Object.keys(readCache()).length} product(s).`);
});
