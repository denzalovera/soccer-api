# Soccer API

A small web app that displays FIFA World Cup group standings using the
[football-data.org](https://www.football-data.org/) API.

A Python server (`serve.py`) serves the static front-end and proxies API
requests so the API key stays server-side and never reaches the browser.

## Requirements

- Python 3 (standard library only — no pip install needed)
- A football-data.org API key (free tier available)

## Setup

1. Create a `.env` file in the project root:

   ```
   FOOTBALL_DATA_API_KEY=your-api-key-here
   ```

   Alternatively, export the `FOOTBALL_DATA_API_KEY` environment variable
   before starting the server.

2. Start the server:

   ```
   python3 serve.py
   ```

   The app runs at `http://localhost:8000/`. A custom port can be passed as
   the first argument: `python3 serve.py 3000`.

## How it works

- `serve.py` — static file server + CORS proxy. Forwards `/api/*` requests
  to `api.football-data.org`, injecting the `X-Auth-Token` header.
- `public/index.html` — page shell.
- `public/js/config.js` — API base URL and competition code (`WC` for World
  Cup).
- `public/js/api.js` — fetches standings from the proxy.
- `public/js/view.js` — renders group tables with qualification highlights.
- `public/js/utils.js` — small formatting helpers.
- `public/css/styles.css` — styling.

## Notes

- The free football-data.org tier allows 10 requests per minute.
- To show a different competition, change `COMPETITION_CODE` in
  `public/js/config.js`.
# soccer-api
