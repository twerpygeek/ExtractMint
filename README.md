# ExtractMint

Elegant static SaaS prototype for converting bank statements, receipts, scans, PDFs, DOCX files, spreadsheets, CSV, and text into cleaner business files.

## What is included

- Animated React/Vite landing app and conversion workspace.
- Client-side extraction for PDFs, images via OCR, DOCX, XLSX/XLS, CSV, and TXT.
- Export buttons for Excel `.xlsx`, Google Docs-ready `.docx`, `.pdf`, and `.csv`.
- Remotion composition for a product explainer.
- HyperFrames-ready HTML source for a website-to-video walkthrough.
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
npm run hyperframes:source
```

The HyperFrames source lives at `hyperframes/extractmint-demo.html`.

## GoDaddy hosting

Run:

```bash
npm run build
```

Upload the contents of `dist/` to the GoDaddy hosting `public_html` directory. This build is static and does not need a Node server.

For production-grade extraction of difficult scanned statements, add a server queue later for OCR, LLM validation, duplicate detection, authentication, billing, and audit logs.
