const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "packsmart-data") : path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "packsmart-db.json");
const SESSION_SECRET = process.env.SESSION_SECRET || "packsmart-demo-session-secret";

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function now() {
  return new Date().toISOString();
}

function cleanMaterial(value) {
  const material = String(value || "").trim();
  return material.toLowerCase() === "click" ? "" : material;
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const seed = {
      users: [],
      sessions: [],
      closetItems: [],
      trips: [],
      recommendations: [],
      activities: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  if (db.schemaVersion !== 3) {
    migrateClothingAssets(db);
    db.schemaVersion = 3;
    writeDb(db);
  }
  return db;
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}

function cookieValue(req, name) {
  const cookie = req.headers.cookie || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    ...headers
  });
  res.end(payload);
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function currentUser(req, db) {
  const token = cookieValue(req, "packsmart_session");
  const session = db.sessions.find((item) => item.token === token);
  if (session) return db.users.find((user) => user.id === session.userId) || null;
  const signedUser = verifySessionToken(token);
  if (!signedUser) return null;
  return db.users.find((user) => user.id === signedUser.id) || signedUser;
}

function requireUser(req, res, db) {
  const user = currentUser(req, db);
  if (!user) {
    send(res, 401, { error: "Please log in first." });
    return null;
  }
  return user;
}

function signSessionUser(user) {
  const payload = Buffer.from(JSON.stringify(publicUser(user))).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `auth_${payload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || !token.startsWith("auth_")) return null;
  const [payload, signature] = token.slice(5).split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function makeSession(db, user) {
  const token = id("sess");
  db.sessions.push({ token, userId: user.id, createdAt: now() });
  return signSessionUser(user);
}

function activity(db, userId, text) {
  db.activities.unshift({ id: id("act"), userId, text, createdAt: now() });
  db.activities = db.activities.slice(0, 80);
}

function seedUser(db, user) {
  const samples = clothingSamples();
  samples.forEach(([name, category, type, color, season, warmth, formality, swatch, image]) => {
    db.closetItems.push({
      id: id("item"),
      userId: user.id,
      name,
      category,
      type,
      color,
      season,
      warmth,
      formality,
      swatch,
      image,
      createdAt: now()
    });
  });
  const tripId = id("trip");
  db.trips.push({
    id: tripId,
    userId: user.id,
    destination: "New York, USA",
    startDate: "2026-05-02",
    endDate: "2026-05-06",
    activities: ["Business Conference", "Networking", "Sightseeing"],
    dressCode: "Business Casual",
    luggage: "Carry-on",
    preferredColors: ["Black", "Blue", "Beige"],
    notes: "I get cold easily and will be walking around the city.",
    weather: forecastFor("New York, USA", 5),
    createdAt: now()
  });
  activity(db, user.id, "Created starter wardrobe");
  activity(db, user.id, "Planned New York trip");
}

function clothingSamples() {
  return [
    ["Khaki Utility Shirt", "Tops", "Button Down Shirt", "Beige", "Spring", "light", "smart casual", "#d8c4a8", "/assets/clothes/clothing-1.jpg"],
    ["Gray Plaid Shirt", "Tops", "Plaid Button Down", "Gray", "All Season", "light", "casual", "#b8bcc1", "/assets/clothes/clothing-2.jpg"],
    ["Navy Plaid Blouse", "Tops", "Short Sleeve Plaid Blouse", "Navy", "Summer", "light", "casual", "#273b55", "/assets/clothes/clothing-3.jpg"],
    ["Light Pink Blouse", "Tops", "Short Sleeve Blouse", "Pink", "Spring", "light", "smart casual", "#f1d7dd", "/assets/clothes/clothing-4.jpg"],
    ["Blue Polka Dot Top", "Tops", "Puff Sleeve Top", "Light Blue", "Summer", "light", "casual", "#c8e4f2", "/assets/clothes/clothing-5.jpg"],
    ["Navy Drawstring Shorts", "Bottoms", "Shorts", "Navy", "Summer", "light", "casual", "#171c34", "/assets/clothes/clothing-6.jpg"],
    ["Brown Lace Wrap Skirt", "Skirts", "Asymmetrical Lace Skirt", "Brown", "Summer", "light", "dressy", "#3b302b", "/assets/clothes/clothing-7.jpg"],
    ["Cream Wide-Leg Pants", "Bottoms", "Wide-Leg Trousers", "Cream", "Spring", "medium", "business", "#d8ceba", "/assets/clothes/clothing-8.jpg"],
    ["White Straight Pants", "Bottoms", "Straight-Leg Pants", "White", "All Season", "medium", "smart casual", "#f2f3f1", "/assets/clothes/clothing-9.jpg"],
    ["Black Dress Pants", "Bottoms", "Dress Pants", "Black", "All Season", "medium", "business", "#15171d", "/assets/clothes/clothing-10.jpg"],
    ["Pale Blue Ribbed Knit Top", "Tops", "Ribbed Knit Top", "Light Blue", "Spring", "medium", "smart casual", "#cfe5e8", "/assets/clothes/clothing-11.jpg"],
    ["Brown Long Cardigan", "Outerwear", "Knit Cardigan", "Brown", "Fall", "warm", "casual", "#3b302b", "/assets/clothes/clothing-12.jpg"],
    ["Light Gray Trench Coat", "Outerwear", "Trench Coat", "Light Gray", "Spring", "medium", "business", "#d8dbd8", "/assets/clothes/clothing-13.jpg"],
    ["White A-Line Skirt", "Skirts", "A-Line Midi Skirt", "White", "Spring", "light", "smart casual", "#f1f0ec", "/assets/clothes/clothing-14.jpg"],
    ["Blue Flare Jeans", "Bottoms", "Flare Jeans", "Blue", "All Season", "medium", "casual", "#315b76", "/assets/clothes/clothing-15.jpg"]
  ];
}

function migrateClothingAssets(db) {
  const oldStarterNames = new Set([
    "Beige Blazer",
    "White Shirt",
    "Black Dress",
    "Blue Jeans",
    "White Sneakers",
    "Brown Sweater",
    "Khaki Pants",
    "Leather Bag",
    "Black Loafers",
    "Silver Watch"
  ]);
  const samples = clothingSamples();
  for (const user of db.users || []) {
    const userItems = db.closetItems.filter((item) => item.userId === user.id);
    const uploadedItems = userItems.filter((item) => !oldStarterNames.has(item.name));
    const existingNames = new Set(uploadedItems.map((item) => item.name));
    const newItems = samples
      .filter(([name]) => !existingNames.has(name))
      .map(([name, category, type, color, season, warmth, formality, swatch, image]) => ({
        id: id("item"),
        userId: user.id,
        name,
        category,
        type,
        color,
        season,
        warmth,
        formality,
        swatch,
        image,
        createdAt: now()
      }));
    db.closetItems = [
      ...db.closetItems.filter((item) => item.userId !== user.id),
      ...uploadedItems,
      ...newItems
    ];
  }
}

function forecastFor(location, days = 5, startDate = null) {
  const base = Array.from(location || "PackSmart").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const conditions = ["Partly Cloudy", "Sunny", "Cloudy", "Light Rain", "Breezy"];
  const start = startDate && !Number.isNaN(new Date(startDate).getTime()) ? new Date(`${startDate}T00:00:00`) : new Date();
  return Array.from({ length: Math.max(1, Math.min(10, Number(days) || 5)) }, (_, index) => {
    const high = 16 + ((base + index * 3) % 11);
    const low = high - 6 - (index % 3);
    const condition = conditions[(base + index) % conditions.length];
    return {
      day: index + 1,
      date: new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10),
      low,
      high,
      condition,
      icon: condition.includes("Rain") ? "rain" : condition === "Sunny" ? "sun" : "cloud"
    };
  });
}

function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function scoreItem(item, trip, weather) {
  let score = 0;
  const activityText = trip.activities.join(" ").toLowerCase();
  const dress = trip.dressCode.toLowerCase();
  if (dress.includes("business") && ["business", "dressy"].includes(item.formality)) score += 3;
  if (dress.includes("casual") && item.formality !== "dressy") score += 2;
  if (activityText.includes("outdoor") && item.category === "Shoes") score += 2;
  if (activityText.includes("conference") && ["Outerwear", "Tops", "Bottoms", "Shoes"].includes(item.category)) score += 2;
  if (weather.high < 20 && ["medium", "warm"].includes(item.warmth)) score += 2;
  if (weather.condition.includes("Rain") && ["Outerwear", "Shoes"].includes(item.category)) score += 1;
  if ((trip.preferredColors || []).includes(item.color)) score += 1;
  if (item.season === "All Season" || item.season === "Spring") score += 1;
  return score;
}

function recommendationPrompt(trip, outfits) {
  return {
    trip: {
      destination: trip.destination,
      dates: `${trip.startDate} to ${trip.endDate}`,
      activities: trip.activities,
      dressCode: trip.dressCode,
      luggage: trip.luggage,
      preferredColors: trip.preferredColors,
      notes: trip.notes
    },
    outfits: outfits.map((outfit) => ({
      day: outfit.day,
      date: outfit.date,
      weather: outfit.weather,
      items: outfit.items.map((item) => ({
        name: item.name,
        category: item.category,
        color: item.color,
        season: item.season,
        warmth: item.warmth,
        formality: item.formality
      }))
    }))
  };
}

function extractResponseText(data) {
  if (data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
      if (content.type === "text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

async function enrichRecommendationWithOpenAI(trip, recommendation) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    recommendation.aiPowered = false;
    recommendation.aiError = "No OpenAI API key configured; used rule-based fallback.";
    return recommendation;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const payload = {
    model,
    input: [
      {
        role: "system",
        content: "You are a concise travel stylist for PackSmart. Generate practical outfit rationales and packing tips. Do not mention being an AI. Return only valid JSON."
      },
      {
        role: "user",
        content: JSON.stringify({
          instructions: "For each outfit day, write one polished whyThisWorks sentence and one packingTip sentence. Keep each under 28 words.",
          data: recommendationPrompt(trip, recommendation.outfits)
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "packsmart_outfit_enrichment",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            days: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  day: { type: "number" },
                  whyThisWorks: { type: "string" },
                  packingTip: { type: "string" }
                },
                required: ["day", "whyThisWorks", "packingTip"]
              }
            }
          },
          required: ["days"]
        }
      }
    }
  };

  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
    const data = await response.json();
    const parsed = JSON.parse(extractResponseText(data));
    const byDay = new Map((parsed.days || []).map((day) => [Number(day.day), day]));
    recommendation.outfits = recommendation.outfits.map((outfit) => {
      const aiDay = byDay.get(outfit.day);
      if (!aiDay) return outfit;
      return {
        ...outfit,
        why: aiDay.whyThisWorks || outfit.why,
        packingTip: aiDay.packingTip || outfit.packingTip
      };
    });
    recommendation.aiPowered = true;
    recommendation.aiModel = model;
  } catch (error) {
    recommendation.aiPowered = false;
    recommendation.aiError = "OpenAI enrichment unavailable; used rule-based fallback.";
  }

  return recommendation;
}

async function recommendOutfits(db, user, trip) {
  const closet = db.closetItems.filter((item) => item.userId === user.id);
  const dayCount = daysBetween(trip.startDate, trip.endDate);
  const weather = forecastFor(trip.destination, dayCount, trip.startDate);
  const categories = ["Outerwear", "Tops", "Bottoms", "Skirts", "Dresses", "Shoes", "Accessories"];
  const outfits = weather.slice(0, dayCount).map((day, index) => {
    const picked = [];
    categories.forEach((category) => {
      const pool = closet
        .filter((item) => item.category === category)
        .sort((a, b) => scoreItem(b, trip, day) - scoreItem(a, trip, day));
      if (pool[0]) picked.push(pool[index % Math.min(pool.length, 2)]);
    });
    const hasDress = picked.some((item) => item.category === "Dresses");
    const filtered = hasDress ? picked.filter((item) => !["Bottoms", "Skirts"].includes(item.category)) : picked;
    return {
      day: index + 1,
      date: day.date,
      weather: day,
      items: filtered.slice(0, 6),
      why: `This outfit matches ${trip.dressCode.toLowerCase()} plans in ${trip.destination} while staying comfortable for ${day.condition.toLowerCase()} weather.`,
      packingTip: day.condition.includes("Rain")
        ? "Pack a light layer and shoes that can handle wet sidewalks."
        : "Keep one flexible layer nearby for changing indoor and outdoor temperatures."
    };
  });
  const recommendation = {
    id: id("rec"),
    userId: user.id,
    tripId: trip.id,
    destination: trip.destination,
    outfits,
    createdAt: now()
  };
  db.recommendations.unshift(recommendation);
  db.recommendations = db.recommendations.slice(0, 30);
  const enriched = await enrichRecommendationWithOpenAI(trip, recommendation);
  activity(db, user.id, `${enriched.aiPowered ? "Generated AI outfits" : "Generated outfits"} for ${trip.destination}`);
  return enriched;
}

async function handleApi(req, res, url) {
  const db = readDb();
  const method = req.method;
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (method === "POST" && url.pathname === "/api/auth/register") {
      const body = await parseBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "Ashley").trim() || "Ashley";
      if (!email || password.length < 6) return send(res, 400, { error: "Email and a 6+ character password are required." });
      if (db.users.some((user) => user.email === email)) return send(res, 409, { error: "That email is already registered." });
      const user = { id: id("user"), name, email, passwordHash: hashPassword(password), provider: "password", avatar: "", createdAt: now() };
      db.users.push(user);
      seedUser(db, user);
      const token = makeSession(db, user);
      writeDb(db);
      return send(res, 201, { user: publicUser(user) }, { "Set-Cookie": `packsmart_session=${token}; HttpOnly; Path=/; SameSite=Lax` });
    }

    if (method === "POST" && url.pathname === "/api/auth/login") {
      const body = await parseBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      const user = db.users.find((candidate) => candidate.email === email);
      if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) {
        return send(res, 401, { error: "Invalid email or password." });
      }
      const token = makeSession(db, user);
      activity(db, user.id, "Logged in");
      writeDb(db);
      return send(res, 200, { user: publicUser(user) }, { "Set-Cookie": `packsmart_session=${token}; HttpOnly; Path=/; SameSite=Lax` });
    }

    if (method === "GET" && url.pathname === "/api/auth/google") {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`;
      if (clientId) {
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "openid email profile",
          prompt: "select_account"
        });
        return redirect(res, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
      }
      return redirect(res, "/api/auth/google/callback?demo=1");
    }

    if (method === "GET" && url.pathname === "/api/auth/google/callback") {
      let profile = { email: "google.demo@packsmart.local", name: "Ashley", avatar: "" };
      if (!url.searchParams.get("demo") && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`;
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: url.searchParams.get("code"),
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
          })
        });
        const tokenData = await tokenResponse.json();
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const googleUser = await userInfo.json();
        profile = { email: googleUser.email, name: googleUser.name, avatar: "" };
      }
      let user = db.users.find((candidate) => candidate.email === profile.email);
      if (!user) {
        user = { id: id("user"), name: profile.name, email: profile.email, passwordHash: hashPassword(id("oauth")), provider: "google", avatar: profile.avatar, createdAt: now() };
        db.users.push(user);
        seedUser(db, user);
      }
      const token = makeSession(db, user);
      activity(db, user.id, "Signed in with Google");
      writeDb(db);
      return redirect(res, "/#/dashboard", { "Set-Cookie": `packsmart_session=${token}; HttpOnly; Path=/; SameSite=Lax` });
    }

    if (method === "GET" && url.pathname === "/api/auth/me") {
      return send(res, 200, { user: publicUser(currentUser(req, db)) });
    }

    if (method === "POST" && url.pathname === "/api/auth/logout") {
      const token = cookieValue(req, "packsmart_session");
      writeDb({ ...db, sessions: db.sessions.filter((session) => session.token !== token) });
      return send(res, 200, { ok: true }, { "Set-Cookie": "packsmart_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax" });
    }

    const user = requireUser(req, res, db);
    if (!user) return;

    if (method === "PUT" && url.pathname === "/api/profile") {
      const body = await parseBody(req);
      const name = String(body.name || "").trim();
      const avatar = String(body.avatar || "").trim();
      if (!name) return send(res, 400, { error: "Name is required." });
      if (avatar && avatar.length > 1_500_000) return send(res, 413, { error: "Avatar image is too large. Please choose a smaller image." });
      user.name = name.slice(0, 60);
      user.avatar = avatar;
      activity(db, user.id, "Updated profile");
      writeDb(db);
      return send(res, 200, { user: publicUser(user) });
    }

    if (method === "GET" && url.pathname === "/api/closet") {
      return send(res, 200, { items: db.closetItems.filter((item) => item.userId === user.id) });
    }

    if (method === "POST" && url.pathname === "/api/closet") {
      const body = await parseBody(req);
      const image = String(body.image || "");
      if (image && image.length > 2_500_000) return send(res, 413, { error: "Clothing image is too large. Please choose a smaller image." });
      const item = {
        id: id("item"),
        userId: user.id,
        name: String(body.name || "New Item").trim(),
        category: String(body.category || "Tops"),
        type: cleanMaterial(body.type || body.material),
        color: String(body.color || "N/A"),
        season: String(body.season || "All Season"),
        warmth: String(body.warmth || "medium"),
        formality: String(body.formality || "casual"),
        swatch: String(body.swatch || "#d9d2c3"),
        image,
        createdAt: now()
      };
      db.closetItems.unshift(item);
      activity(db, user.id, `Added ${item.name} to wardrobe`);
      writeDb(db);
      return send(res, 201, { item });
    }

    if (parts[0] === "api" && parts[1] === "closet" && parts[2]) {
      const item = db.closetItems.find((candidate) => candidate.id === parts[2] && candidate.userId === user.id);
      if (!item) return send(res, 404, { error: "Item not found." });
      if (method === "PUT") {
        const body = await parseBody(req);
        const image = String(body.image || "");
        if (image && image.length > 2_500_000) return send(res, 413, { error: "Clothing image is too large. Please choose a smaller image." });
        Object.assign(item, {
          name: String(body.name || item.name).trim(),
          category: String(body.category || item.category),
          type: typeof body.type === "string" ? cleanMaterial(body.type) : typeof body.material === "string" ? cleanMaterial(body.material) : cleanMaterial(item.type),
          color: typeof body.color === "string" ? body.color.trim() : String(item.color || "N/A"),
          season: String(body.season || item.season || "All Season"),
          warmth: String(body.warmth || item.warmth || "medium"),
          formality: String(body.formality || item.formality || "casual"),
          swatch: String(body.swatch || item.swatch || "#d9d2c3"),
          image
        });
        activity(db, user.id, `Updated ${item.name} in wardrobe`);
        writeDb(db);
        return send(res, 200, { item });
      }
      if (method === "DELETE") {
        db.closetItems = db.closetItems.filter((candidate) => candidate.id !== item.id);
        activity(db, user.id, `Removed ${item.name} from wardrobe`);
        writeDb(db);
        return send(res, 200, { ok: true });
      }
    }

    if (method === "GET" && url.pathname === "/api/trips") {
      return send(res, 200, { trips: db.trips.filter((trip) => trip.userId === user.id) });
    }

    if (method === "POST" && url.pathname === "/api/trips") {
      const body = await parseBody(req);
      const dayCount = daysBetween(body.startDate, body.endDate);
      const trip = {
        id: id("trip"),
        userId: user.id,
        destination: String(body.destination || "New York, USA").trim(),
        startDate: String(body.startDate || new Date().toISOString().slice(0, 10)),
        endDate: String(body.endDate || new Date().toISOString().slice(0, 10)),
        activities: Array.isArray(body.activities) ? body.activities : [],
        dressCode: String(body.dressCode || "Smart Casual"),
        luggage: String(body.luggage || "Carry-on"),
        preferredColors: Array.isArray(body.preferredColors) ? body.preferredColors : [],
        notes: String(body.notes || ""),
        weather: forecastFor(body.destination, dayCount, body.startDate),
        createdAt: now()
      };
      db.trips.unshift(trip);
      activity(db, user.id, `Planned trip to ${trip.destination}`);
      writeDb(db);
      return send(res, 201, { trip });
    }

    if (parts[0] === "api" && parts[1] === "trips" && parts[2]) {
      const trip = db.trips.find((candidate) => candidate.id === parts[2] && candidate.userId === user.id);
      if (!trip) return send(res, 404, { error: "Trip not found." });
      if (method === "PUT") {
        const body = await parseBody(req);
        const dayCount = daysBetween(body.startDate, body.endDate);
        trip.destination = String(body.destination || trip.destination).trim();
        trip.startDate = String(body.startDate || trip.startDate);
        trip.endDate = String(body.endDate || trip.endDate);
        trip.activities = Array.isArray(body.activities) ? body.activities : trip.activities;
        trip.dressCode = String(body.dressCode || trip.dressCode || "Smart Casual");
        trip.luggage = String(body.luggage || trip.luggage || "Carry-on");
        trip.preferredColors = Array.isArray(body.preferredColors) ? body.preferredColors : (trip.preferredColors || []);
        trip.notes = String(body.notes || "");
        trip.weather = forecastFor(trip.destination, dayCount, trip.startDate);
        db.recommendations
          .filter((recommendation) => recommendation.tripId === trip.id && recommendation.userId === user.id)
          .forEach((recommendation) => {
            recommendation.destination = trip.destination;
            const updatedWeather = forecastFor(trip.destination, recommendation.outfits.length || dayCount, trip.startDate);
            recommendation.outfits = recommendation.outfits.map((outfit, index) => ({
              ...outfit,
              date: updatedWeather[index]?.date || outfit.date,
              weather: updatedWeather[index] || outfit.weather
            }));
          });
        activity(db, user.id, `Updated trip to ${trip.destination}`);
        writeDb(db);
        return send(res, 200, { trip });
      }
      if (method === "DELETE") {
        db.trips = db.trips.filter((candidate) => candidate.id !== trip.id);
        db.recommendations = db.recommendations.filter((candidate) => candidate.tripId !== trip.id);
        activity(db, user.id, `Deleted trip to ${trip.destination}`);
        writeDb(db);
        return send(res, 200, { ok: true });
      }
    }

    if (method === "GET" && url.pathname === "/api/weather") {
      return send(res, 200, { forecast: forecastFor(url.searchParams.get("location"), url.searchParams.get("days") || 5) });
    }

    if (method === "GET" && url.pathname === "/api/activity") {
      return send(res, 200, { activities: db.activities.filter((item) => item.userId === user.id).slice(0, 8) });
    }

    if (method === "POST" && url.pathname === "/api/recommendations") {
      const body = await parseBody(req);
      let trip = db.trips.find((candidate) => candidate.id === body.tripId && candidate.userId === user.id);
      if (!trip && body.trip) trip = { ...body.trip, id: id("trip"), userId: user.id, weather: forecastFor(body.trip.destination, daysBetween(body.trip.startDate, body.trip.endDate), body.trip.startDate), createdAt: now() };
      if (!trip) return send(res, 404, { error: "Trip not found." });
      if (!db.trips.some((candidate) => candidate.id === trip.id)) db.trips.unshift(trip);
      const recommendation = await recommendOutfits(db, user, trip);
      writeDb(db);
      return send(res, 201, { recommendation });
    }

    if (method === "GET" && parts[0] === "api" && parts[1] === "recommendations") {
      return send(res, 200, { recommendations: db.recommendations.filter((rec) => rec.userId === user.id) });
    }

    send(res, 404, { error: "API route not found." });
  } catch (error) {
    send(res, 500, { error: error.message || "Server error." });
  }
}

function serveStatic(req, res, url) {
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === "/") filePath = "/index.html";
  let absolute = path.normalize(path.join(PUBLIC_DIR, filePath));

  if (!absolute.startsWith(PUBLIC_DIR) || !fs.existsSync(absolute)) {
    const rootAsset = path.normalize(path.join(ROOT, filePath));
    if (rootAsset.startsWith(ROOT) && fs.existsSync(rootAsset) && /\.(png|jpg|jpeg|svg)$/i.test(rootAsset)) absolute = rootAsset;
  }

  if (!absolute.startsWith(ROOT) || !fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) {
    absolute = path.join(PUBLIC_DIR, "index.html");
  }

  const ext = path.extname(absolute).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(absolute).pipe(res);
}

function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
  return serveStatic(req, res, url);
}

const server = http.createServer(requestHandler);

if (require.main === module) {
  server.listen(PORT, () => {
    ensureDb();
    console.log(`PackSmart is running at http://localhost:${PORT}`);
  });
} else {
  ensureDb();
}

module.exports = requestHandler;
