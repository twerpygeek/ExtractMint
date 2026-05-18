# ExtractMint

Elegant static SaaS prototype for converting bank statements, receipts, scans, PDFs, DOCX files, spreadsheets, CSV, and text into cleaner business files.

## What is included

- Animated React/Vite landing app and conversion workspace.
- Client-side extraction for PDFs, images via OCR, DOCX, XLSX/XLS, CSV, and TXT.
- Export buttons for Excel `.xlsx`, Google Docs-ready `.docx`, `.pdf`, `.csv`, and QuickBooks-ready `.qbo` (OFX).
- Accountant-oriented exports:
  - Per-file review JSON (`*.extractmint-review.json`) with validation flags and SHA-256 fingerprint.
  - Review pack ZIP export with one `.xlsx` + review JSON per uploaded file.
- Remotion composition for a product explainer.
- Remotion vertical onboarding promo for launch and social posts.
- HyperFrames-ready HTML sources for a website-to-video walkthrough and onboarding promo.
- Vercel deployment config and fallback static-hosting notes.

## Local commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run deploy:vercel
```

## Vercel deployment

This repo is configured for Vercel as a static Vite app:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci`

Run:

```bash
npm run deploy:vercel
```

If the CLI asks you to authenticate, run `npx --yes vercel login` first, then rerun the deploy command.

## Video commands

```bash
npm run remotion:studio
npm run remotion:render
npm run remotion:onboarding
npm run hyperframes:source
npm run hyperframes:onboarding
```

The rendered onboarding video is written to `out/extractmint-onboarding.mp4`. The HyperFrames sources live at `hyperframes/extractmint-demo.html` and `hyperframes/extractmint-onboarding.html`.

## Static hosting fallback

Run:

```bash
npm run build
```

Upload the contents of `dist/` to any static host. This build is static and does not need a Node server.

For production-grade extraction of difficult scanned statements, add a server queue later for OCR, LLM validation, duplicate detection, authentication, billing, and audit logs.
