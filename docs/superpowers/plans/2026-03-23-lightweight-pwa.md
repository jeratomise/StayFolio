# Lightweight PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PWA manifest, icons, Apple meta tags, and install prompts so StayFolio can be installed to mobile home screens as a standalone app.

**Architecture:** Create static PWA assets (`public/manifest.json`, icon PNGs) served by Vite, add meta tags to `index.html`, and build a reusable `InstallPrompt` component that detects platform and manages dismiss state via localStorage. The component renders in both the pre-login `Auth` view and the post-login dashboard.

**Tech Stack:** React 19, TypeScript, Vite (static `public/` serving), Tailwind CSS (CDN), Lucide React icons, sharp (dev dependency for one-time icon generation)

**Spec:** `docs/superpowers/specs/2026-03-23-lightweight-pwa-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `public/manifest.json` | PWA manifest with app metadata, display mode, icon references |
| Create | `public/icons/icon.svg` | Master SVG: shield-check on indigo rounded-rect |
| Create | `scripts/generate-icons.mjs` | One-time Node script using sharp to render SVG → PNG at all sizes |
| Create | `public/icons/icon-180.png` | Apple Touch Icon (180x180) |
| Create | `public/icons/icon-192.png` | Android Chrome standard (192x192) |
| Create | `public/icons/icon-512.png` | Android Chrome splash (512x512) |
| Create | `public/icons/icon-maskable-192.png` | Android adaptive with safe zone padding (192x192) |
| Create | `public/icons/icon-maskable-512.png` | Android adaptive with safe zone padding (512x512) |
| Create | `components/InstallPrompt.tsx` | Dismissible install banner with platform detection |
| Modify | `index.html` | Add manifest link, theme-color, Apple meta tags |
| Modify | `components/Auth.tsx` | Render `<InstallPrompt />` between hero section and pricing |
| Modify | `App.tsx` | Render `<InstallPrompt />` at top of dashboard view |

---

## Task 1: Create `public/` directory and PWA manifest

**Files:**
- Create: `public/manifest.json`

- [ ] **Step 1: Create the manifest file**

```json
{
  "name": "StayFolio",
  "short_name": "StayFolio",
  "description": "The Flighty for your Hotel Stays",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FFFFFF",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Verify Vite serves it**

Run: `npm run build && ls dist/manifest.json`
Expected: file exists in build output

- [ ] **Step 3: Commit**

```bash
git add public/manifest.json
git commit -m "feat: add PWA manifest"
```

---

## Task 2: Create master SVG icon and generate PNGs

**Files:**
- Create: `public/icons/icon.svg`
- Create: `public/icons/icon-maskable.svg`
- Create: `scripts/generate-icons.mjs`
- Create: `public/icons/icon-180.png`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-maskable-192.png`
- Create: `public/icons/icon-maskable-512.png`

- [ ] **Step 1: Create the master SVG**

Create `public/icons/icon.svg` — the Lucide shield-check icon (white, stroke-width 2) centered on an indigo-600 background with rounded corners:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#4F46E5"/>
  <g transform="translate(128, 128) scale(10.67)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </g>
</svg>
```

- [ ] **Step 2: Create the maskable SVG variant**

Create `public/icons/icon-maskable.svg` — same icon but scaled to 60% within the safe zone (inner 80% circle), with extra indigo padding:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4F46E5"/>
  <g transform="translate(154, 154) scale(8.5)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </g>
</svg>
```

Note: maskable SVG has no `rx` on the rect (OS applies its own mask) and the icon is smaller (scale 8.5 vs 10.67) with more center padding.

- [ ] **Step 3: Create the icon generation script**

Create `scripts/generate-icons.mjs`:

```javascript
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '../public/icons');

const standardSvg = readFileSync(resolve(iconsDir, 'icon.svg'));
const maskableSvg = readFileSync(resolve(iconsDir, 'icon-maskable.svg'));

const sizes = [
  { input: standardSvg, size: 180, name: 'icon-180.png' },
  { input: standardSvg, size: 192, name: 'icon-192.png' },
  { input: standardSvg, size: 512, name: 'icon-512.png' },
  { input: maskableSvg, size: 192, name: 'icon-maskable-192.png' },
  { input: maskableSvg, size: 512, name: 'icon-maskable-512.png' },
];

for (const { input, size, name } of sizes) {
  await sharp(input)
    .resize(size, size)
    .png()
    .toFile(resolve(iconsDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

console.log('Done!');
```

- [ ] **Step 4: Install sharp and run the script**

```bash
npm install --save-dev sharp
node scripts/generate-icons.mjs
```

Expected output:
```
Generated icon-180.png (180x180)
Generated icon-192.png (192x192)
Generated icon-512.png (512x512)
Generated icon-maskable-192.png (192x192)
Generated icon-maskable-512.png (512x512)
Done!
```

- [ ] **Step 5: Verify the generated PNGs exist**

```bash
ls -la public/icons/*.png
```

Expected: 5 PNG files at the expected sizes.

- [ ] **Step 6: Commit**

```bash
git add public/icons/ scripts/generate-icons.mjs package.json package-lock.json
git commit -m "feat: add PWA icon set with generation script"
```

---

## Task 3: Add meta tags to `index.html`

**Files:**
- Modify: `index.html` (lines 4-6, inside `<head>`)

- [ ] **Step 1: Add PWA and Apple meta tags**

Add the following lines after the existing `<meta name="viewport" ...>` tag (line 4) in `index.html`:

```html
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#FFFFFF">
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="StayFolio">
```

- [ ] **Step 2: Verify the dev server serves everything**

Run: `npm run dev`
Then open `http://localhost:3000/manifest.json` in a browser — should return the manifest JSON.
Open `http://localhost:3000/icons/icon-192.png` — should show the icon.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add PWA meta tags and manifest link to index.html"
```

---

## Task 4: Build the `InstallPrompt` component

**Files:**
- Create: `components/InstallPrompt.tsx`

- [ ] **Step 1: Create the component**

Create `components/InstallPrompt.tsx`:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Share, ShieldCheck } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'stayfolio_install_dismissed';

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/.test(navigator.userAgent);
}

export const InstallPrompt: React.FC = () => {
  const [dismissed, setDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstallNative, setCanInstallNative] = useState(false);

  useEffect(() => {
    // Don't show if already installed, not mobile, or previously dismissed
    if (isStandalone() || !isMobile()) return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    setIsIos(isIosSafari());
    setDismissed(false);

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstallNative(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') handleDismiss();
      deferredPrompt.current = null;
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (dismissed) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm mb-4">
      <div className="bg-indigo-600 p-2 rounded-lg text-white shrink-0">
        <ShieldCheck size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">Add StayFolio to your Home Screen</p>
        {isIos ? (
          <p className="text-xs text-slate-500 mt-0.5">
            Tap <Share size={12} className="inline -mt-0.5" /> then "Add to Home Screen"
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5">
            Install for quick access — no app store needed
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canInstallNative && (
          <button
            onClick={handleInstall}
            className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
          >
            <Download size={14} /> Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add components/InstallPrompt.tsx
git commit -m "feat: add InstallPrompt component with platform detection"
```

---

## Task 5: Render InstallPrompt in pre-login Auth view

**Files:**
- Modify: `components/Auth.tsx` (line 3 for import, line ~257 for placement)

- [ ] **Step 1: Add import**

Add to the imports at the top of `components/Auth.tsx`:

```tsx
import { InstallPrompt } from './InstallPrompt';
```

- [ ] **Step 2: Render the prompt between hero and features section**

In `components/Auth.tsx`, insert `<InstallPrompt />` between the closing `</div>` of the hero grid (after line 256) and the opening of the Feature Section (line 258 `{/* Feature Section - Dark Mode Vibe */}`):

```tsx
      {/* Install Prompt */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 mb-12">
        <InstallPrompt />
      </div>

      {/* Feature Section - Dark Mode Vibe */}
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`
Open `http://localhost:3000` — the install prompt should appear between the hero and the dark features section (only visible on mobile user agents). Use browser DevTools mobile emulation to test.

- [ ] **Step 4: Commit**

```bash
git add components/Auth.tsx
git commit -m "feat: render install prompt on pre-login landing page"
```

---

## Task 6: Render InstallPrompt in post-login dashboard

**Files:**
- Modify: `App.tsx` (line 5 area for import, line 482 area for placement)

- [ ] **Step 1: Add import**

Add to the imports at the top of `App.tsx`:

```tsx
import { InstallPrompt } from './components/InstallPrompt';
```

- [ ] **Step 2: Render inside the dashboard view**

In `App.tsx`, find the dashboard view block (line 481):

```tsx
        {view === 'dashboard' && (
          <div className="space-y-6">
            <StatusTracker stays={myStays} />
```

Insert `<InstallPrompt />` as the first child of that div, before `<StatusTracker>`:

```tsx
        {view === 'dashboard' && (
          <div className="space-y-6">
            <InstallPrompt />
            <StatusTracker stays={myStays} />
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`, log in, and confirm the install prompt appears at the top of the Manage view. Use browser DevTools mobile emulation. Verify:
- Prompt appears on first visit (mobile UA)
- Clicking X dismisses it
- Refreshing the page — prompt stays hidden
- Clear `stayfolio_install_dismissed` from localStorage — prompt returns

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: render install prompt on post-login dashboard"
```

---

## Task 7: Final verification and production build

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: no errors, clean build.

- [ ] **Step 2: Test with preview server**

```bash
npm run preview
```

Open the preview URL. Verify:
- `/manifest.json` is served and contains correct data
- `/icons/icon-192.png` loads correctly
- Chrome DevTools → Application → Manifest shows the manifest with no errors
- On mobile (or mobile emulation), the install prompt banner appears

- [ ] **Step 3: Final commit with any remaining fixes**

```bash
git add -A
git commit -m "feat: lightweight PWA support — manifest, icons, install prompts"
```
