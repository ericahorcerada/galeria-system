# Galeria Butuan City Live MySQL Store Updates

This build makes the public storefront live from MySQL and keeps admin CRUD editable.

## What is live

- `/shop` reads from `store_artworks` through `/api/artworks`.
- `/artwork/[id]` reads from `store_artworks` through `/api/artworks/[id]`.
- Home page Featured Artworks refreshes from `/api/artworks`.
- Admin Artworks writes to `store_artworks`.
- Admin image uploads save to `public/uploads/artworks` and store the returned URL in `store_artworks.image_url`.
- Customer signup writes to `customers` with `password_hash` and starts a customer session.
- Customer/staff/admin login verifies against MySQL.

## Seed database

Use the ready-to-paste SQL file:

```text
database/galeria_live_schema_and_photo_seed.sql
```

It seeds:

- admin login: `admin / artspace2024`
- customer login: `customer@galeria.ph / artspace2024`
- 30 photo-backed storefront artworks using bundled files in `public/artworks`
- starter categories, products, and suppliers

## Production image note

Local uploads work on a VPS or persistent server. For Vercel/serverless production, replace the upload storage with Cloudinary, S3, or Vercel Blob because local uploaded files can disappear after redeploy.
