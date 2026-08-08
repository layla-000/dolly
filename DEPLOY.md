# Dolly Box v1.0 — GitHub Pages Deployment

## 1. Create a GitHub repository

Recommended repository name: `Dolly-Box`

You may make the repository public or private depending on your GitHub plan.
Important: the *web page files themselves* are downloadable by site visitors either way once served.
Dolly Box data and photos remain protected by Supabase Auth + RLS + private Storage.

## 2. Upload this folder

Upload the CONTENTS of this v1.0 folder to the repository root, including:

- index.html
- styles.css
- app.js
- supabase.config.js
- supabase-data.js
- manifest.webmanifest
- dolly-box-icon.svg
- .nojekyll
- .github/workflows/pages.yml

Do not upload a Supabase secret key/service_role key. The included config contains only the publishable key.

## 3. Enable GitHub Pages

Repository → Settings → Pages

Under **Build and deployment / Source**, choose:

`GitHub Actions`

Then push/commit to `main`.

The included Pages workflow will deploy automatically on each push to `main`.

## 4. Open the deployed site

GitHub Pages project sites normally use:

`https://YOUR-USERNAME.github.io/Dolly-Box/`

The app uses relative file paths, so a repository subpath works.

## 5. Supabase Auth settings

For the current email + password login flow, no redirect is required just to sign in.

Still recommended for future password-reset/email-link support:
Supabase → Authentication → URL Configuration

Set **Site URL** to your final GitHub Pages URL, for example:

`https://YOUR-USERNAME.github.io/Dolly-Box/`

If you later add password reset or magic links, add the same origin/path to the allowed Redirect URLs.

## 6. Mobile test checklist

On your phone, open the GitHub Pages URL and verify:

- Login succeeds.
- Session remains after refresh/reopening the tab.
- Sidebar opens and closes by tapping outside it.
- Doll registration modal works.
- Item registration and Wearing Doll selection work.
- Doll ↔ Item detail navigation works both ways.
- Image upload works from Photos/Camera picker.
- Images remain after refresh.
- Wishlist CRUD and conversion buttons work.
- Search works with Doll/Item, category, maker, size, tag, and status.
- Modal content can scroll without the page behind it becoming awkward.
- Bottom controls are not hidden by iPhone safe-area/home indicator.

## Security notes

- `supabase.config.js` contains a publishable key. This is expected for a browser app.
- Never place `sb_secret_...`, `service_role`, DB passwords, or other secrets in GitHub Pages.
- Actual DB and Storage access is enforced by Supabase Auth + RLS.
- The page includes `noindex,nofollow,noarchive` to discourage search indexing. This is NOT an access-control mechanism.
- GitHub Pages itself is public web hosting. The login gate protects the app data, not the downloaded HTML/CSS/JS source.

## Updating later

Replace changed files, commit/push to `main`, and the GitHub Actions workflow will redeploy the site automatically.
Version query strings (`?v=1.0.0`) are included to reduce stale browser-cache problems.
