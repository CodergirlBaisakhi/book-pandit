# Book Pandit — how the app works

This is the full map of the app: what each part is, which screen shows it, and where it is stored.

Families book a pandit for a puja. The family sees the ingredients and the price before they confirm. The pandit sees the date, time, and address, then accepts or declines. Nobody pays inside the app. The app only remembers the amount the pandit is owed. The family pays that amount in cash or UPI on the day, then can mark it paid.

There are two roles.

- **FAMILY** books a puja and pays the pandit.
- **PANDIT** accepts visits and is the person who gets paid.

A person has one role. A family account cannot also be a pandit account.

## Two copies of the app

| | On your computer | Published website |
| --- | --- | --- |
| Address | http://localhost:4200 | https://codergirlbaisakhi.github.io/book-pandit/ |
| Pages | `/login`, `/pujas` | `#/login`, `#/pujas` |
| Who answers | Next.js API at http://localhost:3000 | The Angular app itself |
| Where bookings live | SQLite file `backend/prisma/dev.db` | That browser only, key `bp_demo_db_v1` |
| Sign-in token | JWT in `bp_token`, lasts 7 days | The user id, also in `bp_token` |

GitHub Pages can only serve the Angular files. It cannot run Next.js or SQLite. The published site is a full booking demo that saves everything in the browser you are using. Sign in as the family, book a visit, then sign in as that pandit in the **same browser** to accept it. A different computer, or a private window, has its own empty copy of the bookings.

The local site still talks to the real API. `frontend/src/environments/environment.ts` has `demo: false`. The GitHub build swaps in `environment.github.ts`, which has `demo: true` and `hash: true`.

## What we used

- **Angular 19** for the screens. Standalone components, no NgModules.
- **Next.js 15** for the API only. There is no Next.js page for users.
- **Prisma** and **SQLite** for the local database.
- **JWT** (`jsonwebtoken`) for the local sign-in token. Passwords are hashed with **bcryptjs**.
- **Zod** checks the JSON the API receives.
- **GitHub Actions** builds the Angular app and **GitHub Pages** hosts it.
- Fonts are Fraunces for headings and Outfit for everything else.
- Photos live in `frontend/public/images`.

## Folders

```
backend/prisma/schema.prisma     tables
backend/prisma/catalog.ts        the 21 pujas, prices, and ingredients
backend/prisma/seed.ts           sample families and pandits
backend/prisma/dev.db            the SQLite file (created on your machine, not in git)
backend/.env                     DATABASE_URL and JWT_SECRET (not in git)
backend/src/app/api              every API route
backend/src/lib                  price, time, auth, booking rules
frontend/src/app/pages           each screen
frontend/src/app/core            models, API calls, sign-in, guards
frontend/src/app/demo            the in-browser copy of the API
frontend/public/images           photos
.github/workflows/pages.yml      the publish script
```

## Screens

| Path | Who can open it | What it does |
| --- | --- | --- |
| `/` | anyone | Sends a family to the puja list and a pandit to the schedule |
| `/login` | signed out | Sign in. Sample buttons fill Anita or Raghunath |
| `/register` | signed out | New family or new pandit |
| `/pujas` | family | Pujas grouped into six categories, with a photo and the basic price |
| `/pujas/:id` | family | Ingredients, hours, address, pandit filters, then confirm |
| `/bookings` | family | Their visits. Cancel, mark paid, rate |
| `/pandit` | pandit | Requests, accepted visits, and earlier visits |
| `/pandit/profile` | pandit | Qualification, city, languages, and which pujas they perform |

The header shows the links for the signed-in role. On a narrow screen those links sit behind **Menu**. The footer repeats Sign in, Create an account, Browse pujas, and the two sample logins.

## How a visit moves

1. The family picks a puja, a date, a start time, the hours, and an address.
2. They can filter pandits by minimum rating and by a word in the qualification (for example `Shastri`). Only pandits who listed that puja are shown.
3. Confirming creates a booking with status **PENDING**. The price is saved at that moment. Later price edits do not change old bookings.
4. The pandit sees it under **Requests**, with the address, the family phone, the amount they will be paid, and the ingredients.
5. **Accept** moves it to **ACCEPTED**. If that pandit already has an accepted visit on the same date whose times overlap, the accept is refused.
6. **Decline** is only for a pending request. Status becomes **DECLINED**.
7. The family can **Cancel** a pending or accepted visit. The pandit can cancel an accepted visit. Status becomes **CANCELLED**.
8. After the visit, the pandit presses **Mark complete**. Status becomes **COMPLETED**.
9. The family can then leave one rating from 1 to 5, with an optional comment. A visit can be rated once.
10. The family can press **Mark paid** after the pandit has accepted, including after it is complete. That only sets a flag. No money moves in the app.

Earlier visits on the pandit schedule are the ones that are declined, cancelled, or completed.

## Price

```
extra hours = hours booked − included hours, and never below 0
extra hours are rounded to the nearest half hour
amount due = basic price + extra hours × extra-hour rate
```

Satyanarayan is ₹2,000 for 2 hours and ₹400 an extra hour, so 3 hours is ₹2,400. Hours can be from 0.5 to 12, in steps of 0.5. The end time is the start time plus the hours. Prices are whole rupees.

## Where each thing is stored

### On your computer (the real database)

`backend/.env` points Prisma at `file:./dev.db`, which is `backend/prisma/dev.db`. Passwords in this file are bcrypt hashes. The sign-in secret is `JWT_SECRET` in `.env`. The sample value is `book-pandit-dev-secret`.

`npm run db:setup` inside `backend` creates the tables and loads the catalog and the sample people. `npm run db:seed` reloads that data and **deletes the bookings** already in the file.

### In the published website

Nothing is sent to a server. The browser keeps:

| Key | What it holds |
| --- | --- |
| `bp_token` | Who is signed in. On the published site this is the user id |
| `bp_demo_db_v1` | Every user, pandit profile, and booking created in that browser |

The puja list is not stored there. It is compiled into the site from `frontend/src/app/demo/catalog.json`, which was exported from `backend/prisma/catalog.ts`. New accounts and bookings are added on top of the five sample people. Clearing the site data for that browser wipes the bookings and any account you created. The sample people come back the next time the page loads.

The published site stores the demo password in that same browser record so sign-in can be checked without a server. Do not use a real password on the published site.

### Sign-in token on your computer

`bp_token` holds a JWT. The API reads `Authorization: Bearer …`. The token carries the user id, role, and email, and expires after 7 days. A bad or missing token is treated as signed out.

## Tables

**User** — one person. `email` is unique. `role` is `FAMILY` or `PANDIT`. `phone` and `name` are shown on the visit card.

**PanditProfile** — one row per pandit, tied to that user. Qualification, years of experience, languages, a short bio, city, the average rating, and how many ratings that average came from.

**Puja** — one ritual. Slug, name, category, description, basic price, included hours, extra-hour rate.

**PujaIngredient** — one ingredient line, with a sort order, belonging to one puja.

**PanditPuja** — which pandit performs which puja. A pandit who does not have this link is hidden when a family books that puja.

**Booking** — one visit. It stores the family, the pandit, the puja, the date (`YYYY-MM-DD`), the start time (`HH:MM`), the hours, the address, an optional note, the price pieces (`basePrice`, `extraHours`, `extraHourRate`, `amountDue`), the status, and whether the family marked it paid. The end time is calculated when the booking is shown. It is not a separate column.

**Review** — one rating per booking. Rating 1–5 and an optional comment. Saving it recalculates that pandit's average. The average is rounded to one decimal.

## Sample people

Password for every sample account is `password123`.

| Email | Name | Role | Notes |
| --- | --- | --- | --- |
| family@bookpandit.local | Anita Das | Family | Phone 9000000001. The family button on Sign in |
| raghunath@bookpandit.local | Raghunath Mishra | Pandit | Shastri, Vedapathi. Bhubaneswar. 18 years. Rating 4.8 from 5 reviews. Daily, deity, Satyanarayan, Griha Pravesh |
| suresh@bookpandit.local | Suresh Panda | Pandit | Acharya. Cuttack. 12 years. Rating 4.5. Weekly vratas and deity pujas |
| debendra@bookpandit.local | Debendra Sharma | Pandit | Purohit. Puri. 8 years. Rating 3.5. Hidden when the family sets minimum rating to 4.5 |
| laxmidhar@bookpandit.local | Laxmidhar Das | Pandit | Shastri. Bhubaneswar. 22 years. Rating 5.0. Festivals, weddings, Navagraha |
| reviews@bookpandit.local | Reviewer Family | Family | Only exists so the starter ratings have an author. Not shown on the sign-in page |

Those starter ratings are old completed bookings created by the seed. They are why the pandits already have a rating before anyone new books them.

## The 21 pujas

Prices are in rupees. "Hours" is how many hours the basic price already covers.

### Daily worship

| Puja | Basic price | Hours | Extra hour |
| --- | --- | --- | --- |
| Diya and Aarti | 300 | 1 | 200 |
| Family deity puja | 500 | 1 | 250 |

### Deity-specific puja

| Puja | Basic price | Hours | Extra hour |
| --- | --- | --- | --- |
| Jagannath Puja | 1,500 | 2 | 400 |
| Shiva Puja | 800 | 1.5 | 300 |
| Vishnu Puja | 800 | 1.5 | 300 |
| Durga Puja | 1,000 | 2 | 350 |
| Lakshmi Puja | 800 | 1.5 | 300 |
| Ganesha Puja | 700 | 1.5 | 300 |

### Weekly puja and vrata

| Puja | Basic price | Hours | Extra hour |
| --- | --- | --- | --- |
| Monday Shiva Puja | 600 | 1 | 250 |
| Tuesday Hanuman Puja | 600 | 1 | 250 |
| Thursday Lakshmi Vrata | 700 | 1.5 | 300 |

### Festival puja

| Puja | Basic price | Hours | Extra hour |
| --- | --- | --- | --- |
| Sharadiya Durga Puja | 2,500 | 3 | 500 |
| Diwali Puja | 2,000 | 2 | 400 |
| Saraswati Puja | 1,200 | 2 | 350 |
| Kumar Purnima | 1,500 | 2 | 400 |

### Family occasion puja

| Puja | Basic price | Hours | Extra hour |
| --- | --- | --- | --- |
| Satyanarayan Puja | 2,000 | 2 | 400 |
| Griha Pravesh | 3,500 | 3 | 600 |
| Wedding rituals | 8,000 | 6 | 800 |

### Special-purpose rituals

| Puja | Basic price | Hours | Extra hour |
| --- | --- | --- | --- |
| Navagraha Puja | 2,500 | 2.5 | 500 |
| Vehicle puja | 500 | 1 | 200 |
| Ayudha Puja | 800 | 1 | 250 |

Each puja also has its own ingredient list in `backend/prisma/catalog.ts`. The booking screen and the pandit's visit card both show that list. The family is expected to keep the ingredients at home. The pandit does not bring them.

To change a price or an ingredient, edit `backend/prisma/catalog.ts`, run `npm run db:seed` in `backend`, and copy the same change into `frontend/src/app/demo/catalog.json` if the published site should match.

## Photos

| File | Used for |
| --- | --- |
| `images/hero-puja.jpg` | Sign-in photo, and special-purpose rituals |
| `images/doorway.jpg` | Create-account photo, the puja-list banner, and family occasions |
| `images/diyas.jpg` | Daily worship and festival pujas |
| `images/altar.jpg` | Deity pujas and weekly vratas |

The paths have no leading slash, so they work both at `/` on your computer and at `/book-pandit/` on GitHub Pages.

## API routes

All of these are under `http://localhost:3000/api`. The browser sends the token as `Authorization: Bearer …`. CORS allows any site to call them.

| Method and path | What it does |
| --- | --- |
| `POST /auth/register` | Create a family or a pandit |
| `POST /auth/login` | Check email and password, return a token |
| `GET /auth/me` | The signed-in person |
| `GET /pujas` | All pujas with ingredients |
| `GET /pujas/:id` | One puja |
| `GET /pandits?pujaId=&minRating=&qualification=` | Pandits who perform that puja |
| `GET /pandits/me` | The signed-in pandit's profile |
| `POST /pandits/me` | Save qualification, city, bio, and puja list |
| `GET /bookings` | Visits for the signed-in family or pandit |
| `POST /bookings` | Family creates a visit. The server calculates the price |
| `POST /bookings/:id/accept` | Pandit accepts, unless the time overlaps |
| `POST /bookings/:id/decline` | Pandit declines a pending request |
| `POST /bookings/:id/cancel` | Family, or the pandit after accept |
| `POST /bookings/:id/complete` | Pandit marks an accepted visit complete |
| `POST /bookings/:id/review` | Family rates a completed visit |
| `POST /bookings/:id/mark-paid` | Family records that they paid |

The in-browser demo implements the same calls inside `frontend/src/app/demo/demo-store.ts`. The screens do not know which one is answering. `ApiService` chooses.

## How a change reaches the website

Pushing to `main` runs `.github/workflows/pages.yml`. That workflow installs the frontend, runs `npx ng build --configuration=github --base-href /book-pandit/`, and deploys `frontend/dist/frontend/browser`. The live site updates after that job succeeds. Refresh the page if the old layout is still on screen.

The backend is not part of that deploy. The published site never reads `dev.db`.
