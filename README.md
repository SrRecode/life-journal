# Life Journal

A private, offline-first photo journal and diary you can install on your phone or desktop. Your entries never leave your device — everything is stored locally, and you can take a full encrypted backup whenever you want.

**Live demo:** https://srrecode.github.io/life-journal/

## Features

- **Timeline journal** — write entries with a day name, free-form text, mood, tags, time and place
- **Moods & tags** — tag each day with how it felt; filter and search across everything later
- **Photos** — attach photos to entries; favourites gallery with wrapping pill layout down to 320px
- **Search** — full-text search across your journal
- **Calendar** — month view with your entries marked on the days you wrote
- **Encrypted backup** — export all entries and photos as a single encrypted backup file; restore on any device
- **App lock** — optional PIN lock with auto-lock after inactivity, plus WebAuthn/fingerprint unlock where supported
- **Dark mode** — light, dark, or follow your system setting
- **Offline-first PWA** — installable, works with no connection, service worker caches the whole app
- **Desktop layout** — on wide screens the app renders as a centered phone frame with a fixed bottom nav

## Tech stack

| Layer    | Choice                                          |
| -------- | ----------------------------------------------- |
| Build    | [Vite 8](https://vitejs.dev/)                   |
| UI       | React 19 (JSX)                                  |
| Styling  | Tailwind CSS v4                                 |
| Database | IndexedDB via [Dexie 4](https://dexie.org/)     |
| PWA      | vite-plugin-pwa (Workbox service worker)        |
| Icons    | lucide-react                                    |
| Fonts    | Hanken Grotesk + Newsreader (self-hosted)       |

## Getting started

Requires Node.js 20.19+ (or 22.12+).

```bash
git clone https://github.com/SrRecode/life-journal.git
cd life-journal
npm install
npm run dev        # start dev server on http://localhost:5173
```

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server                |
| `npm run build`   | Production build to `dist/`          |
| `npm run preview` | Preview the production build locally |

## Project structure

```
src/
├── App.jsx                 # App shell, phone-frame wrapper, theme
├── db.js                   # Dexie schema (entries, photos, settings)
├── components/
│   └── ui.jsx              # Shared UI (SectionTitle, Confirm, SettingRow, …)
├── pages/
│   ├── Timeline.jsx        # Home timeline of entries
│   ├── EntryEditor.jsx     # Create / edit an entry
│   ├── CalendarPage.jsx    # Month calendar view
│   ├── PhotosPage.jsx      # Photo grid & favourites
│   ├── SearchPage.jsx      # Full-text search
│   ├── SettingsPage.jsx    # Appearance, app lock, backup, help
│   ├── GuidePage.jsx       # In-app usage guide (accordion)
│   ├── Welcome.jsx         # First-run onboarding
│   └── LockScreen.jsx      # PIN / fingerprint unlock overlay
└── services/
    ├── settings.jsx         # Key/value settings + PIN helpers
    └── backup.js            # Encrypted export / import
```

## Privacy

- All journal data lives in your browser's IndexedDB. There is no server, no account, no analytics.
- Backups are encrypted on-device before they ever touch disk; the key is shown to you and never stored.
- The PIN hash and WebAuthn credential are stored locally and are **excluded** from backup files.

## Deploy

The site is published with **GitHub Pages** on every push to `main` (see `.github/workflows/deploy-pages.yml`). The workflow runs `npm run build -- --base=/life-journal/` and uploads `dist/` as a Pages artifact.

To deploy elsewhere:

- **Vercel** — import the repo; it auto-detects Vite. No extra config needed (base stays `/`).
- **Netlify** — build command `npm run build`, publish directory `dist`.

## License

MIT
