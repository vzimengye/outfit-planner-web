# PackSmart

PackSmart is a full-stack travel outfit planner. Users can create an account, sign in with email/password or Google OAuth, upload clothing items to a personal closet, plan trips with weather/activity requirements, and generate outfit recommendations for each day.

## Features

- Email/password authentication with session cookies
- Google OAuth support when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured
- Demo Google login fallback for local class demos
- OpenAI-powered recommendation explanations when an API key is configured
- Personal closet with uploaded item photos and item metadata
- Trip planning form with location, activities, dates, dress code, luggage type, and notes
- Weather-aware outfit recommendation endpoint
- Dashboard with upcoming trips, weather summary, quick actions, recent activity, and wardrobe preview
- Local JSON database persisted in `data/packsmart-db.json`

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

The app runs without installing third-party packages.

## Optional Google OAuth

Create a Google OAuth web client and add these environment variables:

```text
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

If these are not set, the Google button uses a local demo OAuth user so the authentication flow still works during presentation.

## Optional OpenAI Recommendations

Add an OpenAI API key to enable AI-enhanced outfit explanations and packing tips:

```text
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5.5
```

If no OpenAI key is configured, PackSmart automatically uses the built-in rule-based recommendation fallback.

For OpenAI-compatible providers such as PPIO, put your provider key in `OPENAI_API_KEY` and set `OPENAI_BASE_URL` to the provider's OpenAI-compatible base URL.

## Final Project Checklist

- Design component: Figma mockups are included as local references in this project folder.
- Frontend component: multi-page app with landing, login, dashboard, wardrobe, trips, generator, recommendations, profile, and settings views.
- Backend component: Node server exposes REST APIs for auth, closet, trips, weather, recommendations, and activity history.
- Database: persistent local database file under `data/`.
- API usage: weather and Google OAuth integration points are implemented. Weather has deterministic fallback data for local demos.
