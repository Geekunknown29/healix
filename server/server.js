const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function passwordHash(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function defaultDatabase() {
  return {
    users: [
      { role: "public", email: "public@healthsocial.demo", passwordHash: passwordHash("Public@123"), name: "Public User", phone: "Not provided", verified: true },
      { role: "doctor", email: "doctor@healthsocial.demo", passwordHash: passwordHash("Doctor@123"), name: "Doctor", phone: "Not provided", verified: true },
      { role: "vendor", email: "vendor@healthsocial.demo", passwordHash: passwordHash("Vendor@123"), name: "Vendor", phone: "Not provided", verified: true }
    ],
    state: {
      healixFeedStats: {},
      healixServices: [],
      healixServiceHistory: [],
      healixServiceRatings: {},
      healixUserProfiles: {},
      healixFriendGraph: {},
      healixPosts: [],
      healixMessages: {},
      healixConversations: [],
      healixNotifications: [],
      healixPrivacySettings: {}
    }
  };
}

function ensureDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) writeDatabase(defaultDatabase());
}

function readDatabase() {
  ensureDatabase();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    const fresh = defaultDatabase();
    writeDatabase(fresh);
    return fresh;
  }
}

function writeDatabase(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 12 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function redirectForRole(role) {
  return `/src/html/pages/${role}-interface.html`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, name: "healix-api" });
  }

  if (req.method === "GET" && pathname === "/api/state") {
    const db = readDatabase();
    return sendJson(res, 200, db.state || {});
  }

  const stateMatch = pathname.match(/^\/api\/state\/([^/]+)$/);
  if (req.method === "PUT" && stateMatch) {
    const allowedKeys = new Set(["healixFeedStats", "healixServices", "healixServiceHistory", "healixServiceRatings", "healixUserProfiles", "healixFriendGraph", "healixPosts", "healixMessages", "healixConversations", "healixNotifications", "healixPrivacySettings"]);
    const key = decodeURIComponent(stateMatch[1]);
    if (!allowedKeys.has(key)) return sendJson(res, 400, { error: "Unsupported state key" });
    const body = await readJsonBody(req);
    const db = readDatabase();
    db.state = db.state || {};
    db.state[key] = body.value;
    writeDatabase(db);
    return sendJson(res, 200, { ok: true, key });
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await readJsonBody(req);
    const email = normalizeEmail(body.email);
    const role = String(body.role || "").toLowerCase();
    const password = String(body.password || "");
    const db = readDatabase();
    const user = (db.users || []).find((item) => item.email === email && item.role === role);
    if (!user || user.passwordHash !== passwordHash(password)) {
      return sendJson(res, 401, { error: "Invalid credentials for selected role." });
    }
    return sendJson(res, 200, { role: user.role, email: user.email, name: user.name, redirect: redirectForRole(user.role) });
  }

  if (req.method === "POST" && pathname === "/api/auth/signup") {
    const body = await readJsonBody(req);
    const email = normalizeEmail(body.email);
    const role = String(body.role || "public").toLowerCase();
    const name = String(body.name || email.split("@")[0] || role).trim();
    const phone = String(body.phone || "Not provided").trim();
    if (!email || !["public", "doctor", "vendor"].includes(role)) {
      return sendJson(res, 400, { error: "Valid email and role are required." });
    }
    const db = readDatabase();
    const existing = (db.users || []).find((item) => item.email === email);
    if (existing) return sendJson(res, 409, { error: "A user with this email already exists." });
    db.users.push({ role, email, passwordHash: passwordHash(body.password || "Healix@123"), name, phone, verified: role === "public" });
    db.state = db.state || defaultDatabase().state;
    db.state.healixUserProfiles = db.state.healixUserProfiles || {};
    db.state.healixUserProfiles[email] = { username: name, password: "", mobile: phone, email, aboutMe: "Tell people about your health journey." };
    writeDatabase(db);
    return sendJson(res, 201, { ok: true, role, email, verification: role === "public" ? "Not required" : "Pending verification" });
  }

  return sendJson(res, 404, { error: "API route not found" });
}

function safeStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = path.normalize(path.join(ROOT, decoded === "/" ? "index.html" : decoded));
  if (!target.startsWith(ROOT)) return null;
  return target;
}

function serveStatic(req, res, pathname) {
  const target = safeStaticPath(pathname);
  if (!target) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(target, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(target).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url.pathname);
    return serveStatic(req, res, url.pathname);
  } catch (error) {
    sendJson(res, 500, { error: "Server error", detail: error.message });
  }
});

ensureDatabase();
server.listen(PORT, () => {
  console.log(`Healix running at http://localhost:${PORT}`);
});



