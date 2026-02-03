# Backend (Meanss Code Reviewer)

This backend exposes a `/review` endpoint that uses a generative model (Gemini / Google Generative Language API by default) to produce code reviews.

## Project structure ✅

- `index.js` — minimal entrypoint (starts the server)
- `src/app.js` — express app and middleware
- `src/routes/review.js` — route registration for `/review`
- `src/controllers/reviewController.js` — request handling and validation
- `src/services/geminiService.js` — wrapper that calls the Generative API
- `.env.example` — environment variables example

## Setup 🔧

1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (and optionally `GEMINI_API_URL`).
2. Install dependencies: `npm install`.
3. Start in dev mode: `npm run dev` (requires `nodemon`) or `npm start`.

## Environment variables (important) ⚠️

- `GEMINI_API_KEY` — **required**. Your API key for the generative model provider.
- `GEMINI_API_URL` — optional. If not set a sensible default (text-bison endpoint) is used.
- `PORT` — optional. Defaults to `5000`.

## API: POST /review 🔎

- Request body (JSON):
  - `code` (string, required)
  - `filename` (string, optional)
  - `language` (string, optional)

- Response: `{ review: string }`

Example:

```bash
curl -X POST http://localhost:5000/review \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"hi\")","language":"javascript"}'
```

## Notes & Tips 💡

- The backend expects the API key to be in `GEMINI_API_KEY`; copy `.env.example` to `.env` and fill it in before starting.
- The code supports common response shapes from generative APIs but if you use a different provider you may need to update `src/services/geminiService.js`.
- Keep the server file minimal — all logic lives under `src/` now for clearer organization and easier testing.

If you'd like, I can add input sanitization, request size limits, or rate limiting next. 🔧
