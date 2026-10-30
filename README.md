# AI Proxy Platform — Frontend

React + Vite client for the AI Proxy Platform backend (Spring Boot).

## Features

- Chat-like interface to send prompts to the AI service.
- Quota progress bar (tokens used vs. available), refreshed after every request.
- Requests-per-minute counter with a countdown until the reset.
- When the rate limit is hit (HTTP 429): the send button is disabled and a countdown (from `Retry-After`) is shown.
- When the monthly quota is exhausted (HTTP 402): upgrade modal with a simulated payment.
- Daily usage bar chart for the last 7 days.
- Plan badge (FREE / PRO / ENTERPRISE) with distinct colors.
- Token estimator shown before sending a prompt (~4 characters per token, same formula as the backend).

## Run locally

```bash
npm install
cp .env.example .env      # set VITE_API_URL if the backend is not on localhost:8080
npm run dev               # http://localhost:5173
```

## Deploy on Vercel

1. Vercel → Add New Project → import `camilin0811/Fronted-Proxy` (framework: Vite, root directory: repository root).
2. Environment variable: `VITE_API_URL = https://<your-backend>.up.railway.app`
3. Deploy, then set `FRONTEND_URL` in Railway to the Vercel URL (CORS).

## Structure

```
src/
  api/client.js          REST calls (sends X-User-Id header, parses Retry-After)
  utils/format.js        token estimator, number/date formatting, plan info
  components/
    Header.jsx, PlanBadge.jsx, LoginScreen.jsx
    ChatPanel.jsx        chat + composer + estimator
    QuotaCard.jsx        monthly quota progress bar
    RateLimitCard.jsx    requests/min counter + countdown ring
    UsageChart.jsx       7-day bar chart
    UpgradeModal.jsx     plan selection + simulated payment
  App.jsx                state, polling and error handling (429 / 402)
```
