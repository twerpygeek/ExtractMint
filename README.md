# ExtractMint

Elegant static SaaS prototype for converting bank statements, receipts, scans, PDFs, DOCX files, spreadsheets, CSV, and text into cleaner business files.

## What is included

- Animated React/Vite landing app and conversion workspace.
- Client-side extraction for PDFs, images via OCR, DOCX, XLSX/XLS, CSV, and TXT.
- Statement validation: balance-trail checks plus ending-balance signal matching.
- Export buttons for Excel `.xlsx`, Google Docs-ready `.docx`, `.pdf`, and `.csv`.
- Remotion composition for a product explainer.
- Remotion vertical onboarding promo for launch and social posts.
- HyperFrames-ready HTML sources for a website-to-video walkthrough and onboarding promo.
- GoDaddy shared-hosting deployment notes.

## Local commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Video commands

```bash
npm run remotion:studio
npm run remotion:render
npm run remotion:onboarding
npm run hyperframes:source
npm run hyperframes:onboarding
```

The rendered onboarding video is written to `out/extractmint-onboarding.mp4`. The HyperFrames sources live at `hyperframes/extractmint-demo.html` and `hyperframes/extractmint-onboarding.html`.

## GoDaddy hosting

Run:

```bash
npm run build
```

Upload the contents of `dist/` to the GoDaddy hosting `public_html` directory. This build is static and does not need a Node server.

For production-grade extraction of difficult scanned statements, add a server queue later for OCR, LLM validation, duplicate detection, authentication, billing, and audit logs.
