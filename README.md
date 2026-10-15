# Book Pandit

Families book a pandit for a puja. Pandits see the visit time and address, then accept or cancel. The app stores what the pandit is owed. Payment is cash or UPI on the day.

The published test site is [https://codergirlbaisakhi.github.io/book-pandit/](https://codergirlbaisakhi.github.io/book-pandit/). GitHub Pages cannot run the API or the database, so that copy keeps bookings in the browser. Sign in as the family, make a booking, then sign in as the pandit in the same browser to accept it.

- `backend` — Next.js API and SQLite database
- `frontend` — Angular app

A full guide to the screens, stored fields, prices, and where each file lives is in [APP-GUIDE.md](APP-GUIDE.md).

## Setup

Use two terminals from this folder.

```powershell
copy backend\.env.example backend\.env
cd backend
npm install
npm run db:setup
npm run dev
```

```powershell
cd frontend
npm install
npm start
```

The API runs at http://localhost:3000 and the site at http://localhost:4200.

If npm fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, the network is intercepting HTTPS. Run the install again with `--strict-ssl=false` on this machine only.

## Sample logins

Password for each account is `password123`.

- Family: `family@bookpandit.local`
- Pandit: `raghunath@bookpandit.local`
- Other pandits: `suresh@bookpandit.local`, `debendra@bookpandit.local`, `laxmidhar@bookpandit.local`

## Price

Each puja has a basic price that covers its included hours. Extra hours use that puja's extra-hour rate.

`amount due = basic price + extra hours × extra-hour rate`

Satyanarayan is ₹2,000 for 2 hours and ₹400 for each extra hour, so 3 hours is ₹2,400. Change prices in `backend/prisma/catalog.ts`, then run `npm run db:seed` inside `backend`.
