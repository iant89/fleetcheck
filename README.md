# Fleetcheck

A responsive React + TypeScript fleet tire inspection workspace. The prototype is optimized for the technician flow: customer/equipment selection, axle configuration, inspection setup, guided tire-position progression, quick issue actions, notes/photos, review, and PSI air-up confirmation.

## Run locally

```sh
npm install
npm run dev
```

`npm run build` runs the strict TypeScript build and creates the production bundle. `npm test` runs the domain unit tests.

## Persistence and offline behavior

Inspection drafts and fleet records are stored in this browser's `localStorage`; the service worker caches the application shell for repeat offline access. This is intentionally a local-first prototype, not a server backup or multi-device sync solution. Production use should add authenticated server persistence, photo object storage, idempotent sync, and explicit conflict resolution before being treated as a permanent inspection record.

The initial local state includes a small demo fleet. Reset it from **Settings → Restore demo data**.

## GitHub Pages

The Pages build uses the `/fleetcheck/` base path (the project site URL is `https://iant89.github.io/fleetcheck/`) and keeps Vite's development server at `/`. A GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds and deploys `dist/` whenever changes reach `main`, or when run manually.

To enable deployment, merge this workflow into `main`, then in the repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Subsequent pushes to `main` will publish the site. The service worker and install manifest use base-relative paths so they continue to work under the project-site subpath.
