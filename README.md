# स्वाध्याय — Full-Stack Online Bookstore

A complete, production-ready e-commerce bookstore with real book covers, a database backend, an admin panel, and Razorpay payment integration.

## What you get

- **Real book cover images** — fetched automatically from Open Library by ISBN
- **Real database** — SQLite stores all books, orders, and customer data
- **Real admin panel** — add, edit, delete books; view orders (at `/admin`)
- **Real payments** — Razorpay integration (test mode works immediately; switch to live with your keys)
- **Real cart** — persists per-browser; quantity controls; coupon codes
- **Real checkout** — shipping form, COD + online payment, order confirmation

## Quick start (local)

```bash
# 1. Install dependencies
npm install

# 2. Seed the database with 12 books
npm run seed

# 3. Start the server
npm start

# 4. Open http://localhost:3000
```

That's it. The site is live on your machine. No Razorpay keys needed for testing — the checkout will simulate payments until you add real keys.

## Deploy to Railway (free tier)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from repo
2. Push this folder to a GitHub repo first, or use Railway's CLI:
   ```bash
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   ```
3. Railway auto-detects Node.js and runs `npm start`
4. Add these environment variables in Railway → Variables:
   ```
   ADMIN_PASSWORD=your_secret_password
   RAZORPAY_KEY_ID=rzp_test_your_key
   RAZORPAY_KEY_SECRET=your_secret
   ```
5. Railway gives you a live URL like `swadhyay.up.railway.app`

## Deploy to Render (free tier)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Web Service → Connect repo
3. Settings:
   - Build Command: `npm install`
   - Start Command: `npm run seed && npm start`
4. Add environment variables (same as above)
5. Deploy

## Deploy to any VPS / cloud

```bash
npm install
npm run seed
PORT=80 npm start
```
Use a reverse proxy (nginx/caddy) for HTTPS.

## Getting Razorpay keys

1. Sign up at [razorpay.com](https://razorpay.com) (free)
2. Dashboard → Settings → API Keys → Generate Key
3. Copy the **Key ID** and **Key Secret**
4. Put them in your `.env` file or Railway environment variables
5. Use **test keys** first (money won't be charged). Switch to **live keys** when ready to accept real money.

## Admin panel

- Visit `#admin` or click "Admin" in the nav
- Default password: `admin123` (change in `.env`)
- Add/edit/delete books — covers auto-fetch from Open Library by ISBN
- View all customer orders

## Project structure

```
swadhyay/
├── server/
│   ├── index.js     # Express server + API routes + Razorpay
│   ├── db.js       # SQLite database setup
│   └── seed.js     # Seeds 12 books with real covers
├── public/
│   ├── index.html   # SPA entry point
│   ├── style.css    # All styling
│   └── app.js       # Frontend SPA (home, catalog, cart, checkout, admin)
├── package.json
├── .env.example
└── README.md
```

## Tech stack

- **Backend:** Node.js, Express
- **Database:** SQLite (via better-sqlite3) — zero config, file-based
- **Frontend:** Vanilla JS SPA (no framework needed)
- **Payments:** Razorpay (India's #1 payment gateway)
- **Book covers:** Open Library Covers API (free, no key needed)

## Notes

- SQLite is fine for small-to-medium traffic. For high traffic, swap to PostgreSQL (Railway offers free Postgres).
- The cart uses browser localStorage — it's per-device. For cross-device carts, add user accounts.
- Razorpay test mode doesn't charge real money. The "test payment" dialog confirms the flow works end-to-end.
