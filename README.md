# Kupiku Coffee

A coffee shop management system with a mood-based menu recommendation feature.
Built with **Vite + React + React Router**.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Build for production

```bash
npm run build
npm run preview
```

## Routes

| Path           | Screen                              |
| -------------- | ----------------------------------- |
| `/`            | Landing / hero                      |
| `/mood`        | Mood selection (6 moods)            |
| `/results`     | Recommendation results              |
| `/admin`       | Admin dashboard — menu management   |

The nav buttons on each screen wire through to the next route.

## Project structure

```
kupiku-coffee-app/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              # Entry — sets up router
    ├── App.jsx               # Route definitions
    ├── styles/
    │   ├── tokens.css        # Design tokens (colors, type, radii, shadows)
    │   └── globals.css       # Resets + utility classes (kp-*)
    ├── components/
    │   ├── MoodGlyph.jsx     # 6 geometric mood icons
    │   └── NavIcon.jsx       # Sidebar icons for the dashboard
    ├── data/
    │   ├── moods.js          # Mood model
    │   ├── drinks.js         # Drink catalog
    │   └── menu.js           # Admin table rows
    └── screens/
        ├── Landing.jsx
        ├── MoodSelection.jsx
        ├── Results.jsx
        └── Dashboard.jsx
```

## Design system

- **Type**: Inter (UI), Fraunces (display, italic accents), JetBrains Mono (data).
- **Palette**: `#0F0F0F` bg · `#1A1A1A` / `#2B2B2B` surfaces · `#6B4F3A → #A8835F` warm-brown accents · `#E5E5E5` text.
- **Radii**: 8px small, 12px default. Soft elevations only.
- All design tokens live in `src/styles/tokens.css` as CSS variables — change them in one place.

## Notes

- Drink imagery uses striped placeholders. Drop real product photos into
  `src/assets/` and replace `<DrinkImage />` usages.
- The admin table data lives in `src/data/menu.js` — wire it to your backend.
- No build-time CSS framework — plain CSS variables + small utility classes
  keep the bundle minimal and easy to fork.
