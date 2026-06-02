# BazaarHub Backend API

Node.js + Express + MongoDB REST API

## Setup

```bash
npm install
npm run dev
```

## Deploy on Render

1. Connect repo [trueusman/e-commers-backend](https://github.com/trueusman/e-commers-backend)
2. **Runtime:** Node | **Build:** `npm install` | **Start:** `npm start`
3. **Health check path:** `/health`
4. Set environment variables (see `.env.example`)
5. `RENDER_EXTERNAL_URL` is set automatically by Render for `BACKEND_URL` / Google callback

## .env Variables

See `.env.example` for local and production (Render) values.

---

## API Endpoints

### Auth  `/api/auth`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login user |
| GET | `/me` | Private | Get my profile |
| PUT | `/update-profile` | Private | Update profile |
| PUT | `/change-password` | Private | Change password |

### Listings  `/api/listings`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Public | Get all listings (with filters) |
| GET | `/featured` | Public | Get featured listings |
| GET | `/:id` | Public | Get single listing |
| POST | `/` | Private | Create listing |
| PUT | `/:id` | Private | Update listing |
| DELETE | `/:id` | Private | Delete listing |
| GET | `/user/my-listings` | Private | Get my listings |

### Query Params for GET /api/listings
- `category` - electronics, vehicles, property, fashion, furniture, books, sports, jobs
- `condition` - New, Used, Refurbished
- `location` - city name
- `minPrice` / `maxPrice` - price range
- `q` - search keyword
- `featured` - true/false
- `sort` - newest, oldest, price-asc, price-desc
- `page` / `limit` - pagination

### Users  `/api/users`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/:id` | Public | Get user profile + listings |
| GET | `/` | Admin | Get all users |
| DELETE | `/:id` | Admin | Delete user |

---

## Auth Header
```
Authorization: Bearer <token>
```
