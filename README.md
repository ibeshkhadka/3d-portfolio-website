# 3D Portfolio Website

One folder, one website, two apps:

- `apps/outer` — 3D room shell (Three.js + custom Webpack). Served at `/`.
- `apps/inner` — 2D OS site shown on the desk monitor (Create React App). Served same-origin at `/os`.
- `server/index.js` — unified Express server: outer at `/`, inner at `/os`, contact API at `POST /api/send-email`.

Why one folder: single clone, single `npm run dev` / `npm run build`, single deploy, and the monitor iframe is same-origin (`/os`) instead of a separate domain — no CORS/postMessage hassles, one set of env vars.

## Dev (2 terminals or one command)

```bash
npm install                  # root (concurrently only)
npm install --prefix apps/outer
npm install --prefix apps/inner

npm run dev                  # runs outer (:8081) + inner (:3000) together
```

Open the outer dev server (it logs the URL, e.g. `http://192.168.x.x:8081`).
Append `?dev` to use the live inner site: `http://192.168.x.x:8081?dev`
→ the monitor iframe loads `http://localhost:3000/` instead of `/os/`.

## Prod

```bash
npm run build   # builds outer → apps/outer/public + inner → apps/inner/build
FOLIO_EMAIL=ibeshkhadka35@gmail.com FOLIO_PASSWORD=<gmail-app-password> npm start
```

- Outer: `http://localhost:8080/`
- Inner: `http://localhost:8080/os/`

## Notes

- Page base path: `apps/outer` is served at the Pages subpath root and `apps/inner`
  under `<subpath>/os`. The repo name is only hardcoded in
  `.github/workflows/deploy.yml` (`PUBLIC_URL`) and in
  `apps/outer/src/Application/World/MonitorScreen.ts` (prod iframe), so a future
  rename only needs those two files updated.

- `apps/inner` uses `"homepage": "."` (relative asset paths) so **one build works
  everywhere** — locally under `/os` (`npm start`) and under the GitHub Pages
  subpath. Keep it `.`: `PUBLIC_URL` always overrides `homepage`, so the Pages
  workflow passes an absolute `PUBLIC_URL` (`/3d-portfolio-website/os`) at build
  time, and nothing else needs the subpath baked in.
  Do **not** put an absolute path in `homepage` — it silently breaks the local
  prod build, because `npm start` serves inner at `/os`, not the Pages subpath.
  All `react-router` imports come from `react-router-dom` — do **not** add a
  separate `react-router` dependency (two copies break routing context).
- `apps/outer` monitor (`src/Application/World/MonitorScreen.ts`): prod iframe = `/os/`, `?dev` = `http://localhost:3000/`.
- Contact form mails to `ibeshkhadka35@gmail.com` via `FOLIO_EMAIL` / `FOLIO_PASSWORD`.
- Original repos: outer 3D shell + `portfolio-inner-site` 2D OS (Henry Heffernan, MIT). Rebranded for Ibesh Khadka.
