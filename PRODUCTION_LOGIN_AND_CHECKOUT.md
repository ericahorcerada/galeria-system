# Galeria Butuan City production auth + checkout notes

This build replaces the old mock login and fake checkout with MySQL-backed auth, signed HttpOnly sessions, and database-backed ecommerce orders.

## Environment

This zip includes `.env` and `.env.local` as requested. Rotate the MySQL password, `DB_ADMIN_TOKEN`, and `SESSION_SECRET` before public deployment.

Required variables:

```env
MYSQL_HOST=
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
DB_ADMIN_TOKEN=
SESSION_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## First setup

1. Start the app locally.
2. Open `/admin/db-setup`.
3. Enter `DB_ADMIN_TOKEN`.
4. Run schema setup.
5. Run seed data.

The setup endpoint creates/updates:

- `customers.password_hash`
- `customers.status`
- `store_artworks`
- `store_orders`
- `store_order_items`

The seed endpoint creates the demo catalog and login accounts below.

## Seeded logins

All seeded accounts use this initial password:

```txt
artspace2024
```

Customer:

```txt
customer@galeria.ph
```

Admin:

```txt
admin
```

Staff/supervisor:

```txt
supervisor1
maria.c
johnpaul.r
angela.m
benedict.s
daniel.c
```

`christine.l` is seeded as `on_leave`, so login is blocked until status is changed to `active`.

## What is working now

- Customer registration with scrypt password hashing.
- Customer login by email.
- Admin/staff login by username.
- Signed HttpOnly session cookie.
- Middleware role protection for `/admin` and `/staff`.
- Database-backed artwork catalog API.
- Checkout creates `store_orders` and `store_order_items` records.
- Checkout validates stock and server-side prices from MySQL.
- Checkout reserves inventory by decrementing `store_artworks.stock_quantity` inside a transaction.
- Admin dashboard reads live MySQL order/customer/inventory data.
- Staff dashboard reads live MySQL fulfillment and stock data.
- Admin orders page can update payment and fulfillment status.

## Payment status

This build supports production-safe manual payment flows:

- Cash on delivery / pay on pickup
- GCash instruction flow
- Maya instruction flow
- Bank transfer instruction flow

It does not collect card numbers, CVV, or wallet credentials. To charge cards/e-wallets automatically, add a real PSP such as PayMongo or Stripe and store provider payment intent IDs on `store_orders`.
