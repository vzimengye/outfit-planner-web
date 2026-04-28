const app = document.querySelector("#app");
const modalRoot = document.querySelector("#modal-root");

const state = {
  user: null,
  closet: [],
  trips: [],
  recommendations: [],
  activities: [],
  localWeather: null,
  localWeatherRequested: false,
  selectedDay: 0
};

const avatarImages = [
  "/assets/avatars/avatar-1.jpg",
  "/assets/avatars/avatar-2.jpg",
  "/assets/avatars/avatar-3.jpg",
  "/assets/avatars/avatar-4.jpg",
  "/assets/avatars/avatar-5.jpg"
];

const legacyClothingImages = {
  "Beige Blazer": "/assets/clothes/clothing-13.jpg",
  "White Shirt": "/assets/clothes/clothing-9.jpg",
  "Black Dress": "/assets/clothes/clothing-10.jpg",
  "Blue Jeans": "/assets/clothes/clothing-15.jpg",
  "White Sneakers": "/assets/clothes/clothing-9.jpg",
  "Brown Sweater": "/assets/clothes/clothing-12.jpg",
  "Khaki Pants": "/assets/clothes/clothing-8.jpg",
  "Leather Bag": "/assets/clothes/clothing-7.jpg",
  "Black Loafers": "/assets/clothes/clothing-10.jpg",
  "Silver Watch": "/assets/clothes/clothing-11.jpg"
};

const routes = {
  "/": renderLanding,
  "/login": () => renderAuth("login"),
  "/signup": () => renderAuth("signup"),
  "/dashboard": renderDashboard,
  "/wardrobe": renderWardrobe,
  "/trips": renderTrips,
  "/generate": renderGenerate,
  "/recommendations": renderRecommendations,
  "/profile": renderProfile,
  "/settings": renderSettings
};

const categories = ["Tops", "Bottoms", "Skirts", "Dresses", "Outerwear", "Shoes", "Accessories"];
const activities = ["Business Conference", "Networking", "Sightseeing", "Dinner", "Shopping", "Outdoor Activities"];
const destinationOptions = {
  "United States": ["New York", "Los Angeles", "San Francisco", "Chicago", "Seattle", "Boston", "Washington DC", "Miami", "Las Vegas", "Honolulu"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Quebec City"],
  Mexico: ["Mexico City", "Cancun", "Guadalajara", "Monterrey", "Tulum"],
  Brazil: ["Rio de Janeiro", "Sao Paulo", "Brasilia", "Salvador", "Florianopolis"],
  Argentina: ["Buenos Aires", "Mendoza", "Cordoba", "Bariloche"],
  Chile: ["Santiago", "Valparaiso", "Puerto Natales", "San Pedro de Atacama"],
  Colombia: ["Bogota", "Medellin", "Cartagena", "Cali"],
  Peru: ["Lima", "Cusco", "Arequipa", "Machu Picchu"],
  "United Kingdom": ["London", "Edinburgh", "Manchester", "Liverpool", "Bath", "Oxford"],
  France: ["Paris", "Nice", "Lyon", "Marseille", "Bordeaux", "Strasbourg"],
  Italy: ["Rome", "Florence", "Milan", "Venice", "Naples", "Bologna"],
  Spain: ["Madrid", "Barcelona", "Seville", "Valencia", "Granada", "Bilbao"],
  Portugal: ["Lisbon", "Porto", "Faro", "Madeira", "Coimbra"],
  Germany: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Dresden"],
  Netherlands: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
  Belgium: ["Brussels", "Bruges", "Antwerp", "Ghent"],
  Switzerland: ["Zurich", "Geneva", "Lucerne", "Interlaken", "Zermatt"],
  Austria: ["Vienna", "Salzburg", "Innsbruck", "Graz"],
  Greece: ["Athens", "Santorini", "Mykonos", "Thessaloniki", "Crete"],
  Ireland: ["Dublin", "Galway", "Cork", "Killarney"],
  Denmark: ["Copenhagen", "Aarhus", "Odense"],
  Sweden: ["Stockholm", "Gothenburg", "Malmo"],
  Norway: ["Oslo", "Bergen", "Tromso", "Stavanger"],
  Finland: ["Helsinki", "Rovaniemi", "Turku"],
  Iceland: ["Reykjavik", "Vik", "Akureyri"],
  Turkey: ["Istanbul", "Cappadocia", "Antalya", "Izmir"],
  Morocco: ["Marrakesh", "Casablanca", "Fes", "Tangier", "Chefchaouen"],
  Egypt: ["Cairo", "Luxor", "Aswan", "Alexandria", "Sharm El Sheikh"],
  "South Africa": ["Cape Town", "Johannesburg", "Durban", "Pretoria"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  India: ["Delhi", "Mumbai", "Jaipur", "Agra", "Bengaluru", "Goa"],
  China: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Xi'an", "Hangzhou"],
  Japan: ["Tokyo", "Kyoto", "Osaka", "Sapporo", "Fukuoka", "Nara", "Hiroshima"],
  "South Korea": ["Seoul", "Busan", "Jeju", "Incheon"],
  Thailand: ["Bangkok", "Chiang Mai", "Phuket", "Krabi", "Koh Samui"],
  Vietnam: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hoi An", "Nha Trang"],
  Singapore: ["Singapore"],
  Malaysia: ["Kuala Lumpur", "Penang", "Langkawi", "Malacca"],
  Indonesia: ["Bali", "Jakarta", "Yogyakarta", "Lombok"],
  Philippines: ["Manila", "Cebu", "Boracay", "Palawan"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"],
  "New Zealand": ["Auckland", "Queenstown", "Wellington", "Christchurch", "Rotorua"]
};

const sortedDestinationOptions = Object.fromEntries(
  Object.entries(destinationOptions)
    .sort(([countryA], [countryB]) => countryA.localeCompare(countryB))
    .map(([country, cities]) => [country, [...cities].sort((cityA, cityB) => cityA.localeCompare(cityB))])
);

const extraCountryNames = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Armenia", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
  "Central African Republic", "Chad", "Comoros", "Congo", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba",
  "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Gabon", "Gambia", "Georgia", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iran", "Iraq", "Ireland", "Israel", "Jamaica", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Maldives",
  "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Oman", "Pakistan", "Palau",
  "Panama", "Papua New Guinea", "Paraguay", "Poland", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Sudan", "Sri Lanka", "Sudan", "Suriname", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Yemen", "Zambia", "Zimbabwe"
];

const countryOptions = [...new Set([...Object.keys(sortedDestinationOptions), ...extraCountryNames])].sort((a, b) => a.localeCompare(b));

const cityImageQueries = {
  Amsterdam: "Amsterdam canals Netherlands",
  Athens: "Athens Acropolis Greece",
  Bali: "Bali rice terraces Indonesia",
  Bangkok: "Bangkok temple skyline Thailand",
  Barcelona: "Barcelona Sagrada Familia Spain",
  Beijing: "Beijing Forbidden City China",
  Berlin: "Berlin Brandenburg Gate Germany",
  Boston: "Boston skyline Massachusetts",
  "Buenos Aires": "Buenos Aires Argentina landmark",
  "Cape Town": "Cape Town Table Mountain South Africa",
  Chicago: "Chicago skyline river",
  Copenhagen: "Copenhagen Nyhavn Denmark",
  Dubai: "Dubai Burj Khalifa skyline",
  Edinburgh: "Edinburgh Castle Scotland",
  Florence: "Florence Duomo Italy",
  "Hong Kong": "Hong Kong skyline Victoria Harbour",
  Honolulu: "Honolulu Waikiki beach Hawaii",
  Istanbul: "Istanbul Hagia Sophia Turkey",
  Kyoto: "Kyoto Japan temple",
  Lisbon: "Lisbon Portugal tram",
  London: "London Tower Bridge Big Ben",
  "Los Angeles": "Los Angeles skyline palm trees",
  Madrid: "Madrid Spain city landmark",
  Marrakesh: "Marrakesh Morocco medina",
  Melbourne: "Melbourne skyline Australia",
  "Mexico City": "Mexico City Palacio de Bellas Artes",
  Miami: "Miami beach skyline",
  Milan: "Milan Duomo Italy",
  Montreal: "Montreal Canada skyline",
  "New York": "New York skyline Statue of Liberty",
  Osaka: "Osaka Castle Japan",
  Paris: "Paris Eiffel Tower France",
  Rome: "Rome Colosseum Italy",
  "San Francisco": "San Francisco Golden Gate Bridge",
  Seattle: "Seattle Space Needle skyline",
  Seoul: "Seoul South Korea palace skyline",
  Shanghai: "Shanghai Bund skyline China",
  Singapore: "Singapore Marina Bay Sands",
  Sydney: "Sydney Opera House Australia",
  Tokyo: "Tokyo Shibuya skyline Japan",
  Toronto: "Toronto CN Tower skyline",
  Vancouver: "Vancouver skyline mountains Canada",
  Venice: "Venice Grand Canal Italy",
  Vienna: "Vienna Austria palace",
  Zurich: "Zurich Switzerland old town"
};

const cityImageUrls = {
  Shanghai: "https://upload.wikimedia.org/wikipedia/commons/6/64/Shanghai_skyline_from_the_bund.jpg",
  "New York": "https://commons.wikimedia.org/wiki/Special:FilePath/Manhattan%20from%20Weehawken%2C%20NJ.jpg",
  Paris: "https://commons.wikimedia.org/wiki/Special:FilePath/Tour%20Eiffel%20Wikimedia%20Commons.jpg",
  London: "https://commons.wikimedia.org/wiki/Special:FilePath/Tower%20Bridge%20London%20Feb%202006.jpg",
  Tokyo: "https://commons.wikimedia.org/wiki/Special:FilePath/Tokyo%20Tower%20and%20around%20Skyscrapers.jpg",
  Rome: "https://commons.wikimedia.org/wiki/Special:FilePath/Colosseum%20in%20Rome%2C%20Italy%20-%20April%202007.jpg",
  Sydney: "https://commons.wikimedia.org/wiki/Special:FilePath/Sydney%20Opera%20House%20Sails.jpg",
  Dubai: "https://commons.wikimedia.org/wiki/Special:FilePath/Burj%20Khalifa.jpg",
  Singapore: "https://commons.wikimedia.org/wiki/Special:FilePath/Marina%20Bay%20Sands%20in%20the%20evening%20-%2020110623.jpg",
  Beijing: "https://commons.wikimedia.org/wiki/Special:FilePath/Forbidden%20City%20Beijing%20Shenwumen%20Gate.JPG",
  "San Francisco": "https://commons.wikimedia.org/wiki/Special:FilePath/Golden%20Gate%20Bridge%20as%20seen%20from%20Marshall%20Beach%2C%20March%202017.jpg",
  Seoul: "https://commons.wikimedia.org/wiki/Special:FilePath/Seoul%20%286229616161%29.jpg",
  Barcelona: "https://commons.wikimedia.org/wiki/Special:FilePath/Sagrada%20Familia%2001.jpg",
  Venice: "https://commons.wikimedia.org/wiki/Special:FilePath/Canal%20Grande%20Chiesa%20della%20Salute%20e%20Dogana%20dal%20ponte%20dell%27Accademia.jpg"
};

function destinationImageUrl(city, country) {
  if (cityImageUrls[city]) return cityImageUrls[city];
  const query = cityImageQueries[city] || `${city} ${country} landmark skyline`;
  return `https://source.unsplash.com/900x520/?${encodeURIComponent(query)}`;
}

function attr(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function materialLabel(value) {
  const material = cleanMaterialValue(value);
  return material ? attr(material) : `<span class="empty-value">N/A</span>`;
}

function cleanMaterialValue(value) {
  const material = String(value || "").trim();
  return material.toLowerCase() === "click" ? "" : material;
}

function palettePreview(colors = [], fallback = "#d9d2c3") {
  const swatches = colors.length ? colors : [{ hex: fallback, name: "Auto" }];
  return swatches.slice(0, 3).map((color, index) => `
    <input class="palette-dot-input" type="color" value="${attr(color.hex)}" data-palette-color="${index}" aria-label="Main color ${index + 1}" title="${attr(color.name)}">
  `).join("");
}

function bindPaletteControls() {
  document.querySelectorAll("[data-palette-color]").forEach((input) => {
    input.addEventListener("input", () => {
      const palette = [...document.querySelectorAll("[data-palette-color]")].map((node) => ({
        hex: node.value,
        name: nearestColorName(hexToRgb(node.value))
      }));
      syncPaletteFields(palette, "Color dots updated.");
    });
  });
}

function syncPaletteFields(palette, hintText = "You can edit the color text or color dots if needed.") {
  const colors = palette.slice(0, 3);
  if (!colors.length) return;
  document.querySelector("#itemColor").value = colors.map((color) => color.name).join(", ");
  document.querySelector("#itemSwatch").value = colors[0].hex;
  document.querySelector("#itemPalettePreview").innerHTML = palettePreview(colors);
  document.querySelector("#itemColorHint").textContent = hintText;
  bindPaletteControls();
}

const colors = [
  ["Black", "#111111"],
  ["Blue", "#264761"],
  ["Brown", "#7d5735"],
  ["Beige", "#d8c4a8"],
  ["White", "#f3f1ed"],
  ["Gray", "#9b9b96"]
];

function weatherLabel(code) {
  const weatherCodes = {
    0: "Sunny",
    1: "Mostly Clear",
    2: "Partly Cloudy",
    3: "Cloudy",
    45: "Foggy",
    48: "Foggy",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    80: "Rain Showers",
    81: "Rain Showers",
    82: "Heavy Showers",
    95: "Thunderstorm"
  };
  return weatherCodes[Number(code)] || "Partly Cloudy";
}

async function detectLocalWeather() {
  if (state.localWeatherRequested || !navigator.geolocation) return;
  state.localWeatherRequested = true;

  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      const { latitude, longitude } = position.coords;
      const [place, weather] = await Promise.all([
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`).then((res) => res.json()),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&wind_speed_unit=kmh&timezone=auto`).then((res) => res.json())
      ]);
      const current = weather.current || {};
      state.localWeather = {
        city: place.city || place.locality || place.principalSubdivision || "Your location",
        country: place.countryName || "",
        temp: Math.round(current.temperature_2m ?? 20),
        condition: weatherLabel(current.weather_code),
        humidity: Math.round(current.relative_humidity_2m ?? 45),
        wind: Math.round(current.wind_speed_10m ?? 8),
        precipitation: Math.round(current.precipitation ?? 0)
      };
      if (route() === "/dashboard") renderDashboard();
    } catch {
      state.localWeather = null;
    }
  }, () => {
    state.localWeather = null;
  }, { enableHighAccuracy: false, timeout: 7000, maximumAge: 30 * 60 * 1000 });
}


function route() {
  return location.hash.replace("#", "") || "/";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function displayDate(value) {
  return value ? formatDate(value) : "Select date";
}

function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
    ...options,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

async function loadSession() {
  const { user } = await api("/api/auth/me");
  state.user = user;
  if (user) await loadAppData();
}

async function loadAppData() {
  const [closet, trips, recommendations, activity] = await Promise.all([
    api("/api/closet"),
    api("/api/trips"),
    api("/api/recommendations"),
    api("/api/activity")
  ]);
  state.closet = closet.items || [];
  state.trips = trips.trips || [];
  state.recommendations = recommendations.recommendations || [];
  state.activities = activity.activities || [];
}

function navigate(path) {
  location.hash = path;
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2400);
}

function icon(label) {
  const paths = {
    Dashboard: `<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V21h14V10.5"/><path d="M9 21v-6h6v6"/>`,
    Trips: `<rect x="5" y="7" width="14" height="12" rx="2"/><path d="M9 7V5h6v2"/><path d="M5 12h14"/>`,
    Wardrobe: `<path d="M8 4h8l4 5-3 2v9H7v-9L4 9l4-5Z"/><path d="M10 4c.5 2 3.5 2 4 0"/>`,
    "Generate Outfit": `<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m5 16 .8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>`,
    Profile: `<circle cx="12" cy="8" r="4"/><path d="M4 21c1.7-4 14.3-4 16 0"/>`,
    Settings: `<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a7 7 0 0 0-1.7 1L5 6.1l-2 3.4L5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 3.1h5l.4-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.5c.1-.3.1-.7.1-1Z"/>`,
    "Log out": `<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 4v16h-7"/>`
  };
  return `<span class="side-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[label] || paths.Dashboard}</svg></span>`;
}

function brand() {
  return `<a class="brand" href="#/" aria-label="PackSmart home">
    <span class="brand-mark" aria-hidden="true">
      <img src="/assets/packsmart-icon.png" alt="">
    </span>
    <span>PackSmart</span>
  </a>`;
}

function garment(item, small = false) {
  const cls = item.category === "Shoes" ? "shoes" : item.category === "Accessories" ? "accessories" : "";
  const style = `--swatch:${item.swatch || "#d9d2c3"}`;
  const image = item.image || legacyClothingImages[item.name];
  if (image) return `<img src="${image}" alt="${attr(item.name)}">`;
  return `<div class="garment ${cls}" style="${style}" title="${item.name}"></div>${small ? "" : ""}`;
}

function clothingNote(item) {
  const warmth = item.warmth === "warm" ? "adds warmth" : item.warmth === "light" ? "keeps the outfit breathable" : "works as a balanced layer";
  const style = item.formality === "business" ? "polished enough for structured plans" : item.formality === "dressy" ? "a refined option for nicer moments" : "easy to style for relaxed plans";
  return `${item.name} ${warmth} and feels ${style}. Its ${String(item.color || "neutral").toLowerCase()} tone makes it easy to mix with the rest of your closet.`;
}

function openClothingDetail(item) {
  const fullItem = state.closet.find((candidate) => candidate.id === item.id) || item;
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <section class="modal clothing-detail-modal">
        <div class="card-head">
          <div>
            <h2>${fullItem.name}</h2>
            <p class="muted">${fullItem.category} - ${fullItem.color} - ${fullItem.season}</p>
          </div>
          <button class="btn" id="closeClothingDetail">Close</button>
        </div>
        <div class="clothing-detail-grid">
          <div class="clothing-detail-art">${garment(fullItem)}</div>
          <div class="clothing-detail-copy">
            <h3>Item Details</h3>
            <div class="tag-list">
              <span class="tag">Material: ${materialLabel(fullItem.type)}</span>
              <span class="tag">${fullItem.warmth || "medium"}</span>
              <span class="tag">${fullItem.formality || "casual"}</span>
            </div>
            <h3>Style Note</h3>
            <p>${clothingNote(fullItem)}</p>
            <h3>Color</h3>
            <div class="row"><span class="swatch" style="background:${fullItem.swatch || "#d9d2c3"}"></span><span>${fullItem.color || "Neutral"}</span></div>
            ${state.closet.some((candidate) => candidate.id === fullItem.id) ? `<button class="btn primary" id="detailEditItem">Edit Item</button>` : ""}
          </div>
        </div>
      </section>
    </div>
  `;
  document.querySelector("#closeClothingDetail").addEventListener("click", () => modalRoot.innerHTML = "");
  const editButton = document.querySelector("#detailEditItem");
  if (editButton) editButton.addEventListener("click", () => openItemModal(fullItem));
}

function shell(content, active = "Dashboard") {
  const links = [
    ["Dashboard", "/dashboard"],
    ["Trips", "/trips"],
    ["Wardrobe", "/wardrobe"],
    ["Generate Outfit", "/generate"],
    ["Profile", "/profile"],
    ["Settings", "/settings"]
  ];
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        ${brand()}
        <nav class="side-nav">
          ${links.map(([label, href]) => `
            <a class="side-link ${active === label ? "active" : ""}" href="#${href}">
              ${icon(label)} <span>${label}</span>
            </a>
          `).join("")}
        </nav>
        <button class="side-link logout-link" id="logoutBtn">${icon("Log out")}<span>Log out</span></button>
      </aside>
      <main class="main ${active.toLowerCase().replaceAll(" ", "-")}-main">
        ${content}
      </main>
    </div>
  `;
  document.querySelector("#logoutBtn").addEventListener("click", logout);
}

function savedAvatar(user = state.user) {
  if (!user?.avatar || avatarImages.includes(user.avatar)) return "";
  return user.avatar;
}

function avatarMarkup(user = state.user, id = "") {
  const src = savedAvatar(user);
  if (src) return `<img ${id ? `id="${id}"` : ""} src="${src}" alt="">`;
  return `<span ${id ? `id="${id}"` : ""}>${(user?.name || "A").slice(0, 1).toUpperCase()}</span>`;
}

function header(title, subtitle, action = "") {
  return `
    <div class="main-header">
      <div>
        <h1>${title}</h1>
        <p class="muted">${subtitle}</p>
      </div>
      <div class="profile-chip">
        ${action}
        <button class="icon-btn alert-btn" type="button" aria-label="Alerts" title="Alerts">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
        <div class="avatar">${avatarMarkup()}</div>
        <strong>${state.user?.name || "Ashley"}</strong>
      </div>
    </div>
  `;
}

function requireAuth() {
  if (!state.user) {
    navigate("/login");
    return false;
  }
  return true;
}

function renderLanding() {
  app.innerHTML = `
    <div class="landing">
      <header class="topbar">
        ${brand()}
        <nav class="nav">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#about">About Us</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div class="actions">
          <a class="btn" href="#/login">Log in</a>
          <a class="btn primary" href="#/signup">Sign up</a>
        </div>
      </header>
      <section class="hero">
        <div class="hero-copy">
          <span class="pill">Your AI Travel Companion</span>
          <h1 class="serif">Pack Smart,<br>Dress Better,<br><span>Travel Lighter.</span></h1>
          <p>Get outfit recommendations based on your trip, style, and the weather so packing feels way less chaotic.</p>
          <div class="actions">
            <a class="btn primary" href="#/signup">Get Started <span aria-hidden="true">-></span></a>
            <a class="btn" href="#/login">Log in</a>
          </div>
          <div class="social-proof">
            <span class="faces">${avatarImages.slice(0, 4).map((src) => `<i style="background-image:url('${src}')"></i>`).join("")}</span>
            <span class="stars">★★★★★</span>
            <span>Join 10,000+ happy travelers</span>
          </div>
        </div>
        <div class="hero-media">
          <div class="float-card">
            <h3>AI Outfit Recommendations</h3>
            <p class="muted">Personalized looks from your closet, packed around destination and plans.</p>
          </div>
        </div>
      </section>
      <section class="feature-strip" id="features">
        ${[
          ["Smart Outfit Ideas", "Looks that fit your destination, plans, and style."],
          ["Personalized Packing", "Carry-on friendly lists built from your closet."],
          ["Weather-Aware", "Forecasts shape layers, shoes, and outerwear."],
          ["Digital Wardrobe", "Organize clothes and access them anywhere."]
        ].map(([title, text]) => `
          <div class="feature">
            <span class="feature-icon">${title[0]}</span>
            <div><h3>${title}</h3><p>${text}</p></div>
          </div>
        `).join("")}
      </section>
    </div>
  `;
}

function renderAuth(mode) {
  const isSignup = mode === "signup";
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-art">
        ${brand()}
        <div class="auth-hero-copy">
          <h1 class="serif">Pack Smart,<br>Dress Better,<br>Travel Lighter.</h1>
          <p>Your AI outfit & packing planner<br>for every trip and every you.</p>
        </div>
      </div>
      <main class="auth-panel">
        <section class="auth-card">
          <p class="auth-switch">${isSignup ? "Already have an account?" : "Don't have an account?"}
            <a href="#/${isSignup ? "login" : "signup"}">${isSignup ? "Log in" : "Sign up"}</a>
          </p>
          <h1>${isSignup ? "Create your closet" : "Welcome back!"}</h1>
          <p class="muted">${isSignup ? "Start planning smarter outfits for your trips." : "Log in to continue your journey."}</p>
          <form class="form" id="authForm">
            ${isSignup ? `<label>Name<input name="name" value="Ashley" required></label>` : ""}
            <label>Email<input name="email" type="email" placeholder="you@example.com" required></label>
            <label>Password<input name="password" type="password" minlength="6" placeholder="At least 6 characters" required></label>
            ${!isSignup ? `<a class="forgot-link" href="#/login">Forgot password?</a>` : ""}
            <p class="error" id="authError"></p>
            <button class="btn primary" type="submit">${isSignup ? "Sign up" : "Log in"}</button>
          </form>
          <div class="divider">or</div>
          <a class="btn oauth-btn" href="/api/auth/google"><span class="google-mark">G</span>Continue with Google</a>
          <button class="btn oauth-btn" type="button" id="appleDemo"><span class="apple-mark">●</span>Continue with Apple</button>
          <div class="secure-note">
            <span class="shield">✓</span>
            <div>
              <strong>Your data is secure and private.</strong>
              <p class="muted">We never share your personal information.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;
  document.querySelector("#authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const data = await api(`/api/auth/${isSignup ? "register" : "login"}`, { method: "POST", body: form });
      state.user = data.user;
      await loadAppData();
      navigate("/dashboard");
    } catch (error) {
      document.querySelector("#authError").textContent = error.message;
    }
  });
  document.querySelector("#appleDemo").addEventListener("click", () => toast("Apple sign in is only shown for the mockup."));
}

function renderDashboard() {
  if (!requireAuth()) return;
  const nextTrips = state.trips.slice(0, 2);
  const firstWeather = nextTrips[0]?.weather?.[0] || { high: 20, condition: "Partly Cloudy" };
  const dashboardWeather = state.localWeather || {
    city: nextTrips[0]?.destination || "Berkeley, USA",
    temp: firstWeather.high || 20,
    condition: firstWeather.condition,
    humidity: 45,
    wind: 13,
    precipitation: 10
  };
  shell(`
    <div class="dashboard-screen">
    ${header(`Good morning, ${state.user.name || "Ashley"}!`, "Ready for your next adventure?")}
    <div class="grid two dashboard-top">
      <section class="card">
        <div class="card-head"><h3>Upcoming Trips</h3><a href="#/trips">View all</a></div>
        ${nextTrips.map((trip) => `
          <div class="trip-row">
            ${tripThumb(trip)}
            <div>
              <h3>${trip.destination}</h3>
              <p class="muted">${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}</p>
              <span class="tag">${daysBetween(trip.startDate, trip.endDate)} days</span>
            </div>
            <div class="tag-list">${trip.activities.slice(0,2).map((item) => `<span class="tag">${item}</span>`).join("")}</div>
          </div>
        `).join("") || `<p class="muted">No trips yet. Add one from Generate Outfit.</p>`}
      </section>
      <section class="card">
        <div class="card-head"><h3>Today's Weather</h3><a href="#/generate">View forecast</a></div>
        <p class="muted">${dashboardWeather.city}${dashboardWeather.country ? `, ${dashboardWeather.country}` : ""}</p>
        <div class="weather-hero">
          <div class="temperature">${dashboardWeather.temp}°C</div>
          <div><strong>${dashboardWeather.condition}</strong><p class="muted">${state.localWeather ? "Detected from your current location" : "Feels ready for light layers"}</p></div>
          <div class="sun"></div>
        </div>
        <div class="tag-list">
          <span class="tag">Humidity ${dashboardWeather.humidity}%</span><span class="tag">Wind ${dashboardWeather.wind} km/h</span><span class="tag">Precip ${dashboardWeather.precipitation}%</span>
        </div>
      </section>
    </div>
    <section class="card dashboard-quick">
      <div class="card-head"><h3>Quick Actions</h3></div>
      <div class="quick-grid">
        ${[
          ["Generate Outfit", "/generate", "Get outfit recommendations"],
          ["Add to Wardrobe", "/wardrobe", "Add clothes to your closet"],
          ["Plan a Trip", "/generate", "Set destination and plans"],
          ["View Wardrobe", "/wardrobe", "Browse your clothes"]
        ].map(([title, href, sub]) => `
          <a class="quick-action" href="#${href}">
            <span class="quick-icon">${title[0]}</span><strong>${title}</strong><p class="muted">${sub}</p>
          </a>
        `).join("")}
      </div>
    </section>
    <div class="grid two dashboard-bottom">
      <section class="card">
        <div class="card-head"><h3>Wardrobe Overview</h3><a href="#/wardrobe">View all wardrobe</a></div>
        <div class="mini-items">${state.closet.slice(0, 7).map((item) => `<div class="mini-item">${garment(item, true)}</div>`).join("")}</div>
        <p class="muted" style="margin-top:14px">${state.closet.length} items</p>
      </section>
      <section class="card">
        <div class="card-head"><h3>Recent Activity</h3></div>
        ${(state.activities || []).map((item) => `<div class="activity-row" style="grid-template-columns:44px 1fr"><span class="quick-icon">${item.text[0]}</span><p>${item.text}<br><span class="muted">${new Date(item.createdAt).toLocaleString()}</span></p></div>`).join("")}
      </section>
    </div>
    </div>
  `, "Dashboard");
  detectLocalWeather();
}

function renderWardrobe() {
  if (!requireAuth()) return;
  shell(`
    ${header("My Closet", "Manage your clothes and build your perfect wardrobe.", `<button class="btn primary" id="addItemBtn">Add Clothes</button>`)}
    <div class="closet-toolbar">
      <input id="searchItems" placeholder="Search clothing items...">
      <select id="categoryFilter"><option value="">Category</option>${categories.map((cat) => `<option>${cat}</option>`).join("")}</select>
      <select id="seasonFilter"><option value="">Season</option><option>Spring</option><option>Summer</option><option>Fall</option><option>Winter</option><option>All Season</option></select>
      <select id="formalFilter"><option value="">All styles</option><option value="casual">Casual</option><option value="business">Business</option><option value="dressy">Dressy</option></select>
      <select id="sortItems"><option value="new">Newest</option><option value="name">Name</option></select>
      <button class="btn" id="clearFilters">Clear</button>
    </div>
    <div class="items-grid" id="itemsGrid"></div>
  `, "Wardrobe");
  document.querySelector("#addItemBtn").addEventListener("click", () => openItemModal());
  ["searchItems", "categoryFilter", "seasonFilter", "formalFilter", "sortItems"].forEach((id) => document.querySelector(`#${id}`).addEventListener("input", drawItems));
  document.querySelector("#clearFilters").addEventListener("click", () => {
    ["searchItems", "categoryFilter", "seasonFilter", "formalFilter"].forEach((id) => document.querySelector(`#${id}`).value = "");
    drawItems();
  });
  drawItems();
}

function drawItems() {
  const q = document.querySelector("#searchItems")?.value.toLowerCase() || "";
  const category = document.querySelector("#categoryFilter")?.value || "";
  const season = document.querySelector("#seasonFilter")?.value || "";
  const formality = document.querySelector("#formalFilter")?.value || "";
  const sort = document.querySelector("#sortItems")?.value || "new";
  let items = state.closet.filter((item) =>
    item.name.toLowerCase().includes(q) &&
    (!category || item.category === category) &&
    (!season || item.season === season) &&
    (!formality || item.formality === formality)
  );
  if (sort === "name") items = items.sort((a, b) => a.name.localeCompare(b.name));
  document.querySelector("#itemsGrid").innerHTML = items.map((item) => `
    <article class="item-card" data-item-card="${item.id}">
      <div class="item-art">${garment(item)}</div>
      <div class="item-body">
        <h3>${item.name}</h3>
        <p class="muted">${item.category} - ${item.color} - ${item.season} - Material: ${materialLabel(item.type)}</p>
        <div class="row" style="margin-top:10px">
          <span class="swatch" style="background:${item.swatch}"></span>
          <button class="btn" data-edit="${item.id}" style="margin-left:auto;padding:8px 10px;min-height:34px">Edit</button>
          <button class="btn" data-delete="${item.id}" style="padding:8px 10px;min-height:34px">Delete</button>
        </div>
      </div>
    </article>
  `).join("");
  document.querySelectorAll("[data-item-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      const item = state.closet.find((candidate) => candidate.id === card.dataset.itemCard);
      if (item) openClothingDetail(item);
    });
  });
  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.closet.find((candidate) => candidate.id === button.dataset.edit);
      if (item) openItemModal(item);
    });
  });
  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/closet/${button.dataset.delete}`, { method: "DELETE" });
      await loadAppData();
      drawItems();
      toast("Item removed");
    });
  });
}

function optionList(values, selectedValue = "") {
  return values.map((value) => `<option value="${attr(value)}" ${value === selectedValue ? "selected" : ""}>${value}</option>`).join("");
}

function openItemModal(item = null) {
  const isEditing = Boolean(item);
  const current = item || {};
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <section class="modal">
        <div class="card-head"><h2>${isEditing ? "Edit Clothes" : "Add Clothes"}</h2><button class="btn" id="closeModal">Close</button></div>
        <form class="form item-form" id="itemForm">
          <label>Name<input name="name" placeholder="e.g., Linen shirt" value="${attr(current.name || "")}" autocomplete="off" required></label>
          <div class="grid two">
            <label>Category<select name="category">${optionList(categories, current.category || "Tops")}</select></label>
            <label>Material<input name="material" placeholder="e.g., Linen" value="${attr(cleanMaterialValue(current.type))}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></label>
          </div>
          <div class="grid two">
            <label>Color(s)
              <input name="color" id="itemColor" placeholder="Auto-detected from photo" value="${attr(current.color || "")}">
              <input type="hidden" name="swatch" id="itemSwatch" value="${attr(current.swatch || "#d8c4a8")}">
            </label>
            <label>Season<select name="season">${optionList(["All Season", "Spring", "Summer", "Fall", "Winter"], current.season || "All Season")}</select></label>
          </div>
          <div class="grid two">
            <label>Warmth<select name="warmth">${optionList(["light", "medium", "warm"], current.warmth || "medium")}</select></label>
            <label>Style<select name="formality">${optionList(["casual", "business", "dressy"], current.formality || "casual")}</select></label>
          </div>
          <label>Upload photo
            <input type="file" id="itemImage" accept="image/*" hidden>
            <input type="file" id="itemImageGallery" accept="image/*" hidden>
            <input type="file" id="itemImageCamera" accept="image/*" capture="environment" hidden>
            <div class="upload-actions">
              <button class="btn" type="button" id="pickImageFile">Choose File</button>
              <button class="btn" type="button" id="pickImageGallery">From Gallery</button>
              <button class="btn" type="button" id="pickImageCamera">Take Photo</button>
              <span class="muted small-copy" id="itemImageName">No image selected</span>
            </div>
          </label>
          <div class="auto-color-row">
            <span class="muted">Main colors</span>
            <span class="palette-preview" id="itemPalettePreview">${palettePreview([], current.swatch || "#d8c4a8")}</span>
            <span class="muted small-copy" id="itemColorHint">Upload a photo to auto-fill colors.</span>
          </div>
          ${current.image ? `<div class="mini-item item-form-preview">${garment(current, true)}</div>` : ""}
          <p class="error" id="itemFormError"></p>
          <button class="btn primary" type="submit">${isEditing ? "Save Changes" : "Save Item"}</button>
        </form>
      </section>
    </div>
  `;
  document.querySelector("#closeModal").addEventListener("click", () => modalRoot.innerHTML = "");
  bindPaletteControls();
  document.querySelector("#pickImageFile").addEventListener("click", () => document.querySelector("#itemImage").click());
  document.querySelector("#pickImageGallery").addEventListener("click", () => document.querySelector("#itemImageGallery").click());
  document.querySelector("#pickImageCamera").addEventListener("click", () => document.querySelector("#itemImageCamera").click());

  const processImageFile = async (file) => {
    if (!file) return;
    document.querySelector("#itemImageName").textContent = file.name || "Selected image";
    const hint = document.querySelector("#itemColorHint");
    hint.textContent = "Detecting colors...";
    try {
      const palette = await extractDominantColors(file);
      if (palette.length) {
        syncPaletteFields(palette);
      } else {
        hint.textContent = "Could not detect colors clearly. You can type them manually.";
      }
    } catch {
      hint.textContent = "Could not detect colors clearly. You can type them manually.";
    }
  };

  ["#itemImage", "#itemImageGallery", "#itemImageCamera"].forEach((selector) => {
    document.querySelector(selector).addEventListener("change", async (event) => {
      const file = event.currentTarget.files[0];
      await processImageFile(file);
    });
  });

  document.querySelector("#itemForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const saveButton = event.currentTarget.querySelector("button[type='submit']");
    const errorNode = document.querySelector("#itemFormError");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    errorNode.textContent = "";
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget));
      payload.type = cleanMaterialValue(payload.material);
      delete payload.material;
      delete payload.paletteColor;
      const file = document.querySelector("#itemImage").files[0]
        || document.querySelector("#itemImageGallery").files[0]
        || document.querySelector("#itemImageCamera").files[0];
      payload.image = current.image || "";
      if (file) {
        if (!String(payload.color || "").trim()) {
          const palette = await extractDominantColors(file);
          if (palette.length) {
            payload.color = palette.map((color) => color.name).join(", ");
            payload.swatch = palette[0].hex;
          }
        }
        payload.image = await resizeClothingImage(file);
      }
      await api(isEditing ? `/api/closet/${item.id}` : "/api/closet", { method: isEditing ? "PUT" : "POST", body: payload });
      await loadAppData();
      modalRoot.innerHTML = "";
      renderWardrobe();
      toast(isEditing ? "Item updated" : "Added to wardrobe");
    } catch (error) {
      errorNode.textContent = error.message;
      saveButton.disabled = false;
      saveButton.textContent = isEditing ? "Save Changes" : "Save Item";
    }
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeAvatarImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const side = Math.min(image.width, image.height);
        const sx = (image.width - side) / 2;
        const sy = (image.height - side) / 2;
        ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeClothingImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 900;
        const ratio = Math.min(maxSide / image.width, maxSide / image.height, 1);
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const namedColors = [
  ["Black", [18, 18, 18]],
  ["White", [242, 240, 235]],
  ["Cream", [232, 222, 202]],
  ["Beige", [204, 183, 151]],
  ["Brown", [111, 76, 50]],
  ["Gray", [126, 128, 124]],
  ["Navy", [30, 45, 69]],
  ["Blue", [70, 119, 157]],
  ["Light Blue", [177, 207, 220]],
  ["Green", [62, 111, 74]],
  ["Olive", [110, 116, 78]],
  ["Red", [160, 53, 49]],
  ["Pink", [221, 164, 174]],
  ["Purple", [114, 75, 135]],
  ["Yellow", [221, 181, 63]],
  ["Orange", [203, 124, 48]]
];

function colorDistance(a, b) {
  return ((a[0] - b[0]) ** 2) + ((a[1] - b[1]) ** 2) + ((a[2] - b[2]) ** 2);
}

function nearestColorName(rgb) {
  return namedColors.reduce((best, color) => {
    const distance = colorDistance(rgb, color[1]);
    return distance < best.distance ? { name: color[0], distance } : best;
  }, { name: "Neutral", distance: Infinity }).name;
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex) {
  const clean = String(hex || "#d9d2c3").replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0
  ];
}

function averageCornerBackground(pixels, width, height) {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1]
  ];
  const samples = [];
  points.forEach(([baseX, baseY]) => {
    for (let y = 0; y < Math.min(12, height); y += 3) {
      for (let x = 0; x < Math.min(12, width); x += 3) {
        const px = baseX === 0 ? x : width - 1 - x;
        const py = baseY === 0 ? y : height - 1 - y;
        const index = (py * width + px) * 4;
        samples.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
      }
    }
  });
  return samples.reduce((sum, rgb) => [sum[0] + rgb[0], sum[1] + rgb[1], sum[2] + rgb[2]], [0, 0, 0]).map((value) => Math.round(value / samples.length));
}

function isBackgroundLike(rgb, background) {
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const veryLightNeutral = max > 232 && saturation < 0.16;
  const closeToCornerBackground = colorDistance(rgb, background) < 1200;
  return veryLightNeutral || closeToCornerBackground;
}

function extractDominantColors(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 120;
        const ratio = Math.min(size / image.width, size / image.height, 1);
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, width, height);
        const pixels = ctx.getImageData(0, 0, width, height).data;
        const cornerBackground = averageCornerBackground(pixels, width, height);
        const buckets = new Map();
        const fallbackBuckets = new Map();

        for (let index = 0; index < pixels.length; index += 12) {
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          const a = pixels[index + 3];
          if (a < 180) continue;
          const rgb = [r, g, b];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const bucketKey = `${Math.round(r / 20)},${Math.round(g / 20)},${Math.round(b / 20)}`;
          const target = isBackgroundLike(rgb, cornerBackground) ? fallbackBuckets : buckets;
          const colorWeight = Math.max(0.35, saturation + (255 - max) / 360);
          const bucket = target.get(bucketKey) || { count: 0, r: 0, g: 0, b: 0 };
          bucket.count += colorWeight;
          bucket.r += r * colorWeight;
          bucket.g += g * colorWeight;
          bucket.b += b * colorWeight;
          target.set(bucketKey, bucket);
        }

        const source = buckets.size ? buckets : fallbackBuckets;
        const palette = [...source.values()]
          .map((bucket) => {
            const rgb = [
              Math.round(bucket.r / bucket.count),
              Math.round(bucket.g / bucket.count),
              Math.round(bucket.b / bucket.count)
            ];
            return { rgb, hex: rgbToHex(rgb), name: nearestColorName(rgb), count: bucket.count };
          })
          .sort((a, b) => b.count - a.count)
          .filter((color, index, list) => list.findIndex((other) => other.name === color.name) === index)
          .slice(0, 3);
        resolve(palette);
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderTrips() {
  if (!requireAuth()) return;
  shell(`
    ${header("Trips", "All upcoming travel plans saved to your PackSmart account.", `<a class="btn primary" href="#/generate">New Trip</a>`)}
    <div class="grid">
      ${state.trips.map((trip) => `
        <section class="card">
          <div class="card-head">
            <div class="row">${tripThumb(trip)}<div><h3>${trip.destination}</h3><p class="muted">${formatDate(trip.startDate)} - ${formatDate(trip.endDate)} - ${daysBetween(trip.startDate, trip.endDate)} days</p></div></div>
            <div class="row">
              <button class="btn" data-edit-trip="${trip.id}">Edit</button>
              <button class="btn" data-delete-trip="${trip.id}">Delete</button>
              <button class="btn primary" data-rec-trip="${trip.id}">Generate outfits</button>
            </div>
          </div>
          <div class="tag-list">${trip.activities.map((item) => `<span class="tag">${item}</span>`).join("")}</div>
        </section>
      `).join("") || `<section class="card"><p class="muted">No trips yet.</p></section>`}
    </div>
  `, "Trips");
  document.querySelectorAll("[data-edit-trip]").forEach((button) => {
    button.addEventListener("click", () => {
      const trip = state.trips.find((candidate) => candidate.id === button.dataset.editTrip);
      if (trip) openTripModal(trip);
    });
  });
  document.querySelectorAll("[data-delete-trip]").forEach((button) => {
    button.addEventListener("click", async () => {
      const trip = state.trips.find((candidate) => candidate.id === button.dataset.deleteTrip);
      if (!trip || !confirm(`Delete trip to ${trip.destination}?`)) return;
      await api(`/api/trips/${trip.id}`, { method: "DELETE" });
      await loadAppData();
      renderTrips();
      toast("Trip deleted");
    });
  });
  document.querySelectorAll("[data-rec-trip]").forEach((button) => button.addEventListener("click", () => generateForTrip(button.dataset.recTrip)));
}

function openTripModal(trip) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <section class="modal">
        <div class="card-head"><h2>Edit Trip</h2><button class="btn" id="closeTripModal">Close</button></div>
        <form class="form" id="tripEditForm">
          <label>Destination<input name="destination" value="${attr(trip.destination)}" required></label>
          <div class="grid two">
            <label>Start Date<input type="date" name="startDate" value="${attr(trip.startDate)}" required></label>
            <label>End Date<input type="date" name="endDate" value="${attr(trip.endDate)}" required></label>
          </div>
          <div>
            <strong>Purpose / Activities</strong>
            <div class="tag-list" id="tripActivityPicker">
              ${activities.map((item) => `<button type="button" class="tag ${trip.activities.includes(item) ? "selected" : ""}" data-trip-activity="${item}">${item}</button>`).join("")}
            </div>
          </div>
          <div class="grid two">
            <label>Dress Code<select name="dressCode">${optionList(["Casual", "Smart Casual", "Business Casual", "Business Formal", "Cocktail", "Formal / Black Tie", "Beach / Resort", "Athleisure", "Outdoor / Hiking", "Wedding Guest", "Conference Professional"], trip.dressCode || "Smart Casual")}</select></label>
            <label>Luggage Type<select name="luggage">${optionList(["Carry-on", "Checked Bag", "Backpack"], trip.luggage || "Carry-on")}</select></label>
          </div>
          <label>Additional Notes<textarea name="notes">${attr(trip.notes || "")}</textarea></label>
          <p class="error" id="tripEditError"></p>
          <button class="btn primary" type="submit">Save Trip</button>
        </form>
      </section>
    </div>
  `;
  document.querySelector("#closeTripModal").addEventListener("click", () => modalRoot.innerHTML = "");
  document.querySelectorAll("[data-trip-activity]").forEach((button) => button.addEventListener("click", () => button.classList.toggle("selected")));
  const startInput = document.querySelector("#tripEditForm input[name='startDate']");
  const endInput = document.querySelector("#tripEditForm input[name='endDate']");
  startInput.addEventListener("change", () => {
    endInput.min = startInput.value;
    if (endInput.value && endInput.value < startInput.value) endInput.value = "";
  });
  endInput.min = startInput.value;
  document.querySelector("#tripEditForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const saveButton = event.currentTarget.querySelector("button[type='submit']");
    const errorNode = document.querySelector("#tripEditError");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    errorNode.textContent = "";
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errorNode.textContent = "End date cannot be earlier than start date.";
      saveButton.disabled = false;
      saveButton.textContent = "Save Trip";
      return;
    }
    form.activities = [...document.querySelectorAll("[data-trip-activity].selected")].map((node) => node.dataset.tripActivity);
    try {
      await api(`/api/trips/${trip.id}`, { method: "PUT", body: form });
      await loadAppData();
      modalRoot.innerHTML = "";
      if (route() === "/recommendations") {
        await generateForTrip(trip.id);
      } else {
        render();
        toast("Trip updated");
      }
    } catch (error) {
      errorNode.textContent = error.message;
      saveButton.disabled = false;
      saveButton.textContent = "Save Trip";
    }
  });
}

function tripThumb(trip) {
  const [cityRaw, countryRaw] = String(trip.destination || "").split(",").map((part) => part.trim());
  const city = cityRaw || "New York";
  const country = countryRaw || "United States";
  const src = destinationImageUrl(city, country);
  if (src) return `<div class="trip-thumb" data-city="${attr(city)}"><img src="${src}" alt="${attr(trip.destination)}" onerror="this.remove(); this.parentElement.textContent=this.parentElement.dataset.city;"></div>`;
  return `<div class="trip-thumb">${trip.destination.split(",")[0]}</div>`;
}

function renderGenerate() {
  if (!requireAuth()) return;
  shell(`
    ${header("Plan Your Trip", "Tell us about your trip so we can recommend the best outfits for you.")}
    <div class="grid sidebar-layout">
      <section class="card">
        <h3>Trip Details</h3>
        <form class="form" id="tripForm">
          <div class="grid two">
            <label>Country<input name="country" id="countrySelect" list="countryList" placeholder="Select or type the country" required><datalist id="countryList">${countryOptions.map((country) => `<option value="${attr(country)}"></option>`).join("")}</datalist></label>
            <label>City<input name="city" id="citySelect" list="cityList" placeholder="Select or type the city" required><datalist id="cityList"></datalist></label>
          </div>
          <input type="hidden" name="destination" id="destinationInput" value="">
          <div class="grid two">
            <label>Start Date<input class="date-input" type="text" name="startDate" placeholder="Select start date" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" required></label>
            <label>End Date<input class="date-input" type="text" name="endDate" placeholder="Select end date" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" required></label>
          </div>
          <div>
            <strong>Purpose / Activities</strong>
            <div class="tag-list" id="activityPicker">${activities.map((item) => `<button type="button" class="tag" data-activity="${item}">${item}</button>`).join("")}</div>
          </div>
          <label>Dress Code<select name="dressCode" required><option value="">Select the dress code</option><option>Casual</option><option>Smart Casual</option><option>Business Casual</option><option>Business Formal</option><option>Cocktail</option><option>Formal / Black Tie</option><option>Beach / Resort</option><option>Athleisure</option><option>Outdoor / Hiking</option><option>Wedding Guest</option><option>Conference Professional</option></select></label>
          <label>Luggage Type<select name="luggage" required><option value="">Select the luggage type</option><option>Carry-on</option><option>Checked Bag</option><option>Backpack</option></select></label>
          <div>
            <strong>Preferred Colors</strong>
            <div class="tag-list" id="colorPicker">${colors.map(([name, hex]) => `<button type="button" class="tag" data-color="${name}"><span class="swatch" style="background:${hex}"></span> ${name}</button>`).join("")}</div>
          </div>
          <label>Additional Notes<textarea name="notes">e.g., I get cold easily, prefer comfortable shoes, and may attend evening events.</textarea></label>
          <button class="btn primary" type="submit">Generate Outfit Recommendations</button>
        </form>
      </section>
      <aside class="grid">
        <section class="card">
          <h3>Trip Preview</h3>
          <div class="trip-preview-image" id="previewImage"><span>Destination</span></div>
          <h3 id="previewDestination">Select a destination</h3>
          <p class="muted" id="previewDates"></p>
        </section>
        <section class="card">
          <h3>Expected Weather</h3>
          <div id="weatherPreview"></div>
        </section>
        <section class="card">
          <h3>Packing Tips</h3>
          <ul>
            <li>Bring one layer for variable indoor temperatures.</li>
            <li>Keep comfortable shoes for walking days.</li>
            <li>Reuse neutral items across multiple outfits.</li>
          </ul>
        </section>
      </aside>
    </div>
  `, "Generate Outfit");
  document.querySelectorAll("[data-activity],[data-color]").forEach((button) => button.addEventListener("click", () => button.classList.toggle("selected")));
  document.querySelector("#countrySelect").addEventListener("change", () => {
    populateCities(true);
    updatePreview();
  });
  document.querySelector("#citySelect").addEventListener("change", updatePreview);
  document.querySelector("#tripForm").addEventListener("input", updatePreview);
  document.querySelector("input[name='startDate']").addEventListener("change", syncEndDateMinimum);
  document.querySelector("input[name='endDate']").addEventListener("change", validateTripDates);
  document.querySelector("#tripForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    populateCities();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (!validateTripDates()) return;
    form.activities = [...document.querySelectorAll("[data-activity].selected")].map((node) => node.dataset.activity);
    form.preferredColors = [...document.querySelectorAll("[data-color].selected")].map((node) => node.dataset.color);
    if (!form.activities.length) {
      toast("Select at least one activity");
      return;
    }
    const { trip } = await api("/api/trips", { method: "POST", body: form });
    await generateForTrip(trip.id);
  });
  populateCities();
  syncEndDateMinimum();
  updatePreview();
}

function syncEndDateMinimum() {
  const startInput = document.querySelector("input[name='startDate']");
  const endInput = document.querySelector("input[name='endDate']");
  if (!startInput || !endInput) return;
  endInput.min = startInput.value || "";
  if (startInput.value && endInput.value && endInput.value < startInput.value) {
    endInput.value = "";
    toast("End date cannot be earlier than start date");
  }
}

function validateTripDates() {
  const startInput = document.querySelector("input[name='startDate']");
  const endInput = document.querySelector("input[name='endDate']");
  if (!startInput || !endInput) return true;
  syncEndDateMinimum();
  if (startInput.value && endInput.value && endInput.value < startInput.value) {
    endInput.value = "";
    toast("End date cannot be earlier than start date");
    return false;
  }
  return true;
}

function populateCities(resetCity = false) {
  const countrySelect = document.querySelector("#countrySelect");
  const citySelect = document.querySelector("#citySelect");
  const destinationInput = document.querySelector("#destinationInput");
  if (!countrySelect || !citySelect || !destinationInput) return;
  const countryKey = countryOptions.find((country) => country.toLowerCase() === countrySelect.value.toLowerCase()) || countrySelect.value;
  const cities = sortedDestinationOptions[countryKey] || [];
  const previous = citySelect.value;
  const cityList = document.querySelector("#cityList");
  if (cityList) cityList.innerHTML = cities.map((city) => `<option value="${attr(city)}"></option>`).join("");
  if (resetCity && cities.length && cities.includes(previous)) citySelect.value = "";
  destinationInput.value = citySelect.value && countrySelect.value ? `${citySelect.value}, ${countrySelect.value}` : "";
}

async function updatePreview() {
  const form = document.querySelector("#tripForm");
  if (!form) return;
  populateCities();
  const data = Object.fromEntries(new FormData(form));
  document.querySelector("#previewDestination").textContent = data.destination || "Select a destination";
  document.querySelector("#previewDates").textContent = `${displayDate(data.startDate)} - ${displayDate(data.endDate)}${data.startDate && data.endDate ? ` - ${daysBetween(data.startDate, data.endDate)} days` : ""}`;
  const previewImage = document.querySelector("#previewImage");
  if (previewImage) {
    if (data.city && data.country) {
      previewImage.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.08)), url("${destinationImageUrl(data.city, data.country)}")`;
      previewImage.innerHTML = "";
    } else {
      previewImage.style.backgroundImage = "";
      previewImage.innerHTML = "<span>Select destination</span>";
    }
  }
  const { forecast } = await api(`/api/weather?location=${encodeURIComponent(data.destination || "Destination")}&days=${data.startDate && data.endDate ? daysBetween(data.startDate, data.endDate) : 5}`);
  document.querySelector("#weatherPreview").innerHTML = forecast.slice(0, 5).map((day) => `
    <div class="weather-row" style="grid-template-columns:1fr auto auto">
      <span>Day ${day.day}</span><span>${day.low}°C - ${day.high}°C</span><span>${day.condition}</span>
    </div>
  `).join("");
}

async function generateForTrip(tripId) {
  const { recommendation } = await api("/api/recommendations", { method: "POST", body: { tripId } });
  await loadAppData();
  state.selectedDay = 0;
  navigate("/recommendations");
  toast(`Outfits ready for ${recommendation.destination}`);
}

function renderRecommendations() {
  if (!requireAuth()) return;
  const rec = state.recommendations[0];
  if (!rec) {
    shell(`${header("Your Outfit Recommendations", "Generate a trip first to see outfits here.")}<section class="card"><a class="btn primary" href="#/generate">Plan a Trip</a></section>`, "Generate Outfit");
    return;
  }
  const outfit = rec.outfits[state.selectedDay] || rec.outfits[0];
  const trip = state.trips.find((candidate) => candidate.id === rec.tripId);
  const dateRange = trip ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}` : "";
  const details = trip || { activities: [], dressCode: "Smart Casual", luggage: "Carry-on" };
  const recDestination = trip?.destination || rec.destination;
  shell(`
    ${header("Your Outfit Recommendations", `Based on your trip to ${recDestination}${dateRange ? ` (${dateRange})` : ""}`, `<button class="btn primary" onclick="toast('Saved outfits')">Save All Outfits</button>${trip ? `<button class="btn" data-edit-rec-trip="${trip.id}">Edit Trip</button>` : ""}`)}
    <div class="recommendation-layout">
      <section class="recommendation-main">
        <div class="days recommendation-days">${rec.outfits.map((day, index) => `<button class="day-tab ${index === state.selectedDay ? "active" : ""}" data-day="${index}"><strong>Day ${day.day}</strong><br>${formatDate(day.date)}</button>`).join("")}</div>
        <section class="card recommendation-card">
          <div class="recommendation-day-head">
            <h2>Day ${outfit.day} • ${formatDate(outfit.date)}</h2>
            <p class="muted">${outfit.weather.condition} · ${outfit.weather.low}°C - ${outfit.weather.high}°C</p>
          </div>
          <div class="outfit-stage recommendation-stage">${outfit.items.map((item, index) => `<button class="mini-item recommendation-piece clothing-click" data-rec-item="${index}" type="button">${garment(item)}</button>`).join("")}</div>
          <div class="recommendation-closet-head">
            <h3>From Your Closet</h3>
            <a class="btn" href="#/wardrobe">View in Closet</a>
          </div>
          <div class="mini-items recommendation-closet">${outfit.items.map((item, index) => `<button class="mini-item clothing-click" data-rec-item="${index}" type="button">${garment(item, true)}</button>`).join("")}</div>
        </section>
      </section>
      <aside class="recommendation-side">
        <section class="card detail-card">
          <h3>Outfit Details</h3>
          ${rec.aiPowered ? `<span class="tag selected">AI enhanced</span>` : `<span class="tag">Rule-based fallback</span>`}
          <h4>Occasion</h4>
          <div class="tag-list">${(details.activities || []).slice(0, 3).map((item) => `<span class="tag">${item}</span>`).join("") || `<span class="tag">Travel</span>`}</div>
          <h4>Dress Code</h4>
          <span class="tag">${details.dressCode || "Smart Casual"}</span>
          <h4>Luggage Type</h4>
          <span class="tag">${details.luggage || "Carry-on"}</span>
          <h4>Weather</h4>
          <div class="weather-detail">
            <span class="weather-mark">☀</span>
            <div><strong>${outfit.weather.low}°C - ${outfit.weather.high}°C</strong><p class="muted">${outfit.weather.condition}</p></div>
          </div>
          <h3>Why This Works</h3>
          <p>${outfit.why}</p>
          <h3>Color Palette</h3>
          <div class="row">${outfit.items.map((item) => `<span class="swatch" style="background:${item.swatch}"></span>`).join("")}</div>
        </section>
        <section class="card tip-card">
          <h3>Packing Tip</h3>
          <p>${outfit.packingTip}</p>
        </section>
      </aside>
    </div>
  `, "Generate Outfit");
  document.querySelectorAll("[data-day]").forEach((button) => button.addEventListener("click", () => {
    state.selectedDay = Number(button.dataset.day);
    renderRecommendations();
  }));
  document.querySelectorAll("[data-edit-rec-trip]").forEach((button) => {
    button.addEventListener("click", () => {
      const editableTrip = state.trips.find((candidate) => candidate.id === button.dataset.editRecTrip);
      if (editableTrip) openTripModal(editableTrip);
    });
  });
  document.querySelectorAll("[data-rec-item]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = outfit.items[Number(button.dataset.recItem)];
      if (item) openClothingDetail(item);
    });
  });
}

function renderProfile() {
  if (!requireAuth()) return;
  const currentAvatar = savedAvatar();
  shell(`${header("Profile", "Update your name and avatar for this PackSmart account.")}
    <section class="card profile-card">
      <div class="profile-editor">
        <div>
          <div class="avatar profile-avatar" id="profileAvatarPreview">${avatarMarkup(state.user)}</div>
          <p class="muted" style="margin-top:12px">${state.user.email}</p>
        </div>
        <form class="form" id="profileForm">
          <label>Name<input name="name" value="${state.user.name || ""}" required maxlength="60"></label>
          <label>Avatar<input type="file" id="profileAvatarInput" accept="image/*"></label>
          <p class="muted">Default avatar is gray. Upload a photo here if you want to use your own profile picture.</p>
          <p class="muted">Provider: ${state.user.provider} · Closet items: ${state.closet.length} · Trips planned: ${state.trips.length}</p>
          <p class="error" id="profileError"></p>
          <button class="btn primary" type="submit">Save Profile</button>
        </form>
      </div>
    </section>`, "Profile");
  let selectedAvatar = currentAvatar;
  document.querySelector("#profileAvatarInput").addEventListener("change", async (event) => {
    const file = event.currentTarget.files[0];
    if (!file) return;
    try {
      selectedAvatar = await resizeAvatarImage(file);
      document.querySelector("#profileAvatarPreview").innerHTML = `<img src="${selectedAvatar}" alt="">`;
      document.querySelector("#profileError").textContent = "";
    } catch {
      document.querySelector("#profileError").textContent = "Could not load that image. Please try another one.";
    }
  });
  document.querySelector("#profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const saveButton = event.currentTarget.querySelector("button[type='submit']");
    const errorNode = document.querySelector("#profileError");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    errorNode.textContent = "";
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    payload.avatar = selectedAvatar;
    try {
      const { user } = await api("/api/profile", { method: "PUT", body: payload });
      state.user = user;
      await loadAppData();
      toast("Profile saved");
      renderProfile();
    } catch (error) {
      errorNode.textContent = error.message;
      saveButton.disabled = false;
      saveButton.textContent = "Save Profile";
    }
  });
}

function renderSettings() {
  if (!requireAuth()) return;
  shell(`${header("Settings", "Presentation-friendly demo settings.")}
    <section class="card">
      <h3>Project Notes</h3>
      <p>This build keeps user data in a local database file for class demos and can be swapped to Postgres or MongoDB later.</p>
      <p class="muted">Real Google OAuth works when the Google environment variables are configured.</p>
    </section>`, "Settings");
}

async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  state.user = null;
  state.closet = [];
  state.trips = [];
  state.recommendations = [];
  navigate("/");
}

async function boot() {
  try {
    await loadSession();
  } catch {
    state.user = null;
  }
  window.addEventListener("hashchange", render);
  render();
}

function render() {
  const view = routes[route()] || routes["/"];
  view();
}

window.navigate = navigate;
window.toast = toast;
boot();
