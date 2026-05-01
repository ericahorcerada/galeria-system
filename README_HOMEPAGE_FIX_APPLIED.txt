Homepage fix applied:

1. Fixed React textarea NULL error by normalizing all homepage settings from MySQL.
2. Repaired old homepage_settings rows where fields like subtitle were NULL.
3. Homepage image uploads from /admin/homepage now publish to MySQL immediately.
4. Customer homepage fetches /api/homepage with no-store/cache-bust and displays the saved MySQL background/featured image.
5. Keeps existing 8 artists functionality from the provided project.

Use:
- npm install
- npm run dev
- Open /admin/homepage
- Upload or paste a background image URL
- Click Save Homepage for text/link changes. Uploaded images publish immediately.
- Refresh the customer homepage.
