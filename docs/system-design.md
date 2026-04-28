# PackSmart System Design

## Tech Stack

- Frontend: HTML, CSS, and vanilla JavaScript single page app with client-side routing.
- Backend: Node.js HTTP server using only built-in modules.
- Database: file-backed JSON database at `data/packsmart-db.json`.
- APIs: Google OAuth 2.0 for optional real Google sign-in, OpenAI Responses API for AI-enhanced recommendation text, plus an internal weather endpoint with deterministic demo weather.

## High Level Features

- Users can sign up, log in, log out, and continue with Google.
- Each user gets a personal wardrobe where they can add, edit, filter, and delete clothing items.
- Users can create trips with location, activities, travel dates, luggage type, dress code, preferred colors, and notes.
- The app generates daily outfit recommendations using closet items, trip activity, weather, and dress code.
- When `OPENAI_API_KEY` is configured, the backend enriches each recommended outfit with AI-generated rationale and packing tips.
- The home dashboard shows upcoming trips, weather, quick actions, recent activity, and a wardrobe overview.

## Frontend Implementation

- `public/index.html` contains the app shell and modal roots.
- `public/styles.css` defines the visual system based on the Figma mockups: white surfaces, soft borders, deep green actions, and travel/wardrobe cards.
- `public/app.js` handles routing, form submission, API calls, rendering, and local UI state.
- Routes include landing, auth, dashboard, wardrobe, trips, generate outfit, recommendations, profile, and settings.

## Backend Implementation

- `server.js` serves static assets and exposes REST endpoints under `/api`.
- Auth endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/google`
  - `GET /api/auth/google/callback`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Wardrobe endpoints:
  - `GET /api/closet`
  - `POST /api/closet`
  - `PUT /api/closet/:id`
  - `DELETE /api/closet/:id`
- Trip endpoints:
  - `GET /api/trips`
  - `POST /api/trips`
  - `PUT /api/trips/:id`
  - `DELETE /api/trips/:id`
- Planning endpoints:
  - `GET /api/weather?location=...&days=...`
  - `POST /api/recommendations`
  - `GET /api/activity`

The recommendation route first builds a deterministic closet/weather match so the app works offline. It then optionally calls OpenAI to polish the daily explanation and packing tip; if the request fails, the rule-based output is returned.

## Database Design

The database stores:

- `users`: id, name, email, password hash, auth provider, avatar, created date.
- `sessions`: session token mapped to user id.
- `closetItems`: user id, name, category, type, color, season, warmth, formality, image data.
- `trips`: user id, destination, start/end dates, activities, dress code, luggage, colors, notes, weather.
- `recommendations`: user id, trip id, daily outfits, weather, packing tips.
- `activities`: user id, action text, timestamp.

## Group Work Split

- Member 1: authentication, backend routes, database persistence, recommendation logic.
- Member 2: frontend screens, styling from Figma mockups, forms, dashboard, and presentation polish.
