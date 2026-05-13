# GoDaddy Deployment

ExtractMint is configured as a static Vite build so it can run on normal GoDaddy shared hosting.

1. Run `npm install`.
2. Run `npm run build`.
3. Open the generated `dist/` folder.
4. Upload everything inside `dist/` to `public_html` in GoDaddy cPanel File Manager or over SFTP.
5. Visit the domain and hard-refresh the browser.

The build includes a `public/.htaccess` file that is copied into `dist/`. Keep it when uploading because it sets safe MIME types for `.mjs`, SVG, and WASM-style assets on Apache hosting.

The browser build handles conversion locally. That keeps deployment simple and private, but production SaaS features such as user accounts, subscriptions, conversion credits, server OCR, Google Drive export, and bank-specific model tuning need a backend.
