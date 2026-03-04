# SD Corp

## Current State
SD Corp is a full-stack construction business management web app with:
- Authentication (login, register, PIN setup/unlock, profile)
- Dashboard with business overview
- Site management and site detail (transactions, labour, work progress tabs)
- Summary/reports page
- Dark/light mode toggle
- React + TanStack Router frontend, Motoko backend

The app is NOT currently a PWA — it has no web app manifest, no service worker, no offline support, and no installable prompt.

## Requested Changes (Diff)

### Add
- `manifest.webmanifest` in `public/` with full PWA metadata (name, short_name, icons, theme_color, background_color, display: standalone, orientation: portrait)
- SD Corp app icons: 192x192 and 512x512 PNG (generated)
- Maskable icon variant for Android adaptive icons
- `vite-plugin-pwa` integration in `vite.config.js` to auto-generate service worker
- Service worker with offline caching strategy (cache-first for static assets, network-first for API calls)
- `<meta>` tags in `index.html` for PWA: theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-title, apple-touch-icon
- "Install App" banner component that shows Android Chrome's install prompt (beforeinstallprompt)
- Splash screen support via manifest background_color and icons
- Offline indicator banner shown when navigator.onLine is false

### Modify
- `index.html`: add PWA meta tags, link to manifest, set title to "SD Corp"
- `vite.config.js`: add vite-plugin-pwa with workbox config
- `App.tsx` or Layout: integrate install prompt banner and offline indicator

### Remove
- Nothing removed
