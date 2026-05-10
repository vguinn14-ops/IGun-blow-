# GunSim Pro Online

GunSim Pro Online is an original browser-based firearm collection and shooting-range simulator. It is designed as a fan-style online experience with original weapon names, SVG visuals, synthesized sound effects, unlock progression, attachments, achievements, scoring, and responsive controls.

> This project does not copy existing app assets, weapon renders, audio, branding, or trademarks.

## Features

- Six original weapon profiles with capacity, caliber, damage, accuracy, recoil, and fire-rate stats.
- Interactive fire, reload, and reset controls with muzzle flash animation.
- Browser-generated Web Audio effects for firing, reloads, and empty magazines.
- Three selectable ranges with different distances and ambience colors.
- Toggleable attachments: holo optic, compensator brake, tactical laser, and neon skin.
- Score-based unlocks and achievements for collection progression.
- Fully static frontend that can be hosted by any simple web server.

## Run locally

```bash
npm start
```

Then open <http://localhost:5173>.

## Publish on GitHub Pages

This repo includes a GitHub Actions workflow that publishes the static app to GitHub Pages whenever changes are pushed to `main`, `master`, or `work`.

1. Push this repository to GitHub.
2. In GitHub, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Run the **Deploy static site to GitHub Pages** workflow or push a new commit.
5. Open the generated `https://<username>.github.io/<repo>/` Pages URL.

The app uses relative asset paths, so it works both at the root of a `github.io` site and under a project path like `/IGun-blow-/`.

## Check JavaScript syntax

```bash
npm run check
```
