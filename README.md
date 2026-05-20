# Carvoo Server

REST API backend for **Carvoo**, a car rental platform. Built with Express and MongoDB, it handles authentication, car listings, and bookings for the Carvoo client app.

## Tech Stack

- **Node.js** + **Express 5**
- **MongoDB** (Atlas) via the official driver
- **JWT** authentication with httpOnly cookies
- **CORS** configured for local and deployed frontends

## Features

- JWT-based auth (login, logout, protected routes)
- CRUD for cars (add, list, search, update, delete)
- Bookings with booking count updates on cars
- Role-aware user payloads in tokens
- Environment validation on startup

## Project Structure

```
carvoo-server/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── verifyToken.js     # JWT verification (cookie or Bearer)
├── routes/
│   ├── auth.routes.js     # Auth & profile
│   ├── cars.routes.js     # Car listings
│   └── bookings.routes.js # Bookings
├── index.js               # App entry point
└── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or compatible MongoDB URI)

## Installation

1. Clone the repository and go into the project folder:

   ```bash
   git clone <your-repo-url>
   cd carvoo-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root (see [Environment variables](#environment-variables)).

4. Start the server:

   ```bash
   npm run dev    # development with file watch
   # or
   npm start      # production-style start
   ```

The API runs at `http://localhost:5000` by default (or the port set in `PORT`).

## Environment Variables

Create a `.env` file with the following:

| Variable | Required | Description |
|----------|----------|-------------|
| `ACCESS_TOKEN_SECRET` | Yes | Secret used to sign and verify JWTs |
| `MONGODB_URI` | Yes* | Full MongoDB connection string |
| `DB_USER` | Yes* | Atlas username (if not using `MONGODB_URI`) |
| `DB_PASS` | Yes* | Atlas password (if not using `MONGODB_URI`) |
| `DB_CLUSTER_HOST` | No | Atlas cluster host (default: `cluster0.ctcyekk.mongodb.net`) |
| `DB_NAME` | No | Database name (default: `carvoo`) |
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | No | Set to `production` for production cookie/security behavior |

\* Provide either `MONGODB_URI` **or** both `DB_USER` and `DB_PASS`.

Example:

```env
ACCESS_TOKEN_SECRET=your_super_secret_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=carvoo
PORT=5000
```

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check — returns a simple running message |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/jwt` | No | Issue JWT from user payload (sets httpOnly cookie) |
| `POST` | `/jwt-login` | No | Login with email/password (sets httpOnly cookie) |
| `POST` | `/logout` | No | Clear auth cookie |
| `GET` | `/profile` | Yes | Get current user from token |

### Cars

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/cars` | Yes | Add a new car (owner = logged-in user) |
| `GET` | `/cars` | No | List cars; query: `carName`, `carType` |
| `GET` | `/cars/available` | No | Top 6 cars with `availability: true` |
| `GET` | `/cars/my-cars` | No | Cars by owner; query: `ownerEmail` |
| `GET` | `/cars/:id` | No | Single car by ID |
| `PATCH` | `/cars/:id` | Yes | Update own car |
| `DELETE` | `/cars/:id` | Yes | Delete own car |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/bookings` | Yes | Create booking; increments car `booking_count` |
| `GET` | `/bookings` | Yes | List bookings; query `email` must match logged-in user |
| `DELETE` | `/bookings/:id` | Yes | Cancel own booking |

## Authentication

Protected routes expect a valid JWT in one of two ways:

1. **httpOnly cookie** — `access_token` (used by the browser client with `credentials: true`)
2. **Authorization header** — `Bearer <token>` (useful for Postman or API tools)

Tokens are signed with `ACCESS_TOKEN_SECRET`. Login tokens expire after 1 hour.

## CORS

Allowed origins are configured in `index.js`. By default:

- `http://localhost:5173` (Vite dev server)
- `https://carvoo.vercel.app`

Add your deployed frontend URL to the `allowedOrigins` array before deploying.

## MongoDB Collections

The API uses these collections:

- **users** — email, password, role (used by `/jwt-login`)
- **cars** — listings with `ownerEmail`, `availability`, `booking_count`, etc.
- **bookings** — linked to `carId` and `userEmail`

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run the server |
| `npm run dev` | Run with Node `--watch` for auto-restart on file changes |

## License

ISC
