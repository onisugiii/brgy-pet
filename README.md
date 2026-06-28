# BRGY-PET Backend

Node.js + Express REST API for the BRGY-PET Animal Tracking & Registration system.
Uses **SQLite** (via `better-sqlite3`) — no external database needed.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed the database with sample data + default admin
npm run seed

# 3. Start the server
npm start          # production
npm run dev        # auto-restart with nodemon
```

Server runs on **http://localhost:3000**

---

## Default Admin Account (after seed)

| Field    | Value                      |
|----------|----------------------------|
| Email    | admin@barangay.gov.ph      |
| Password | admin1234                  |

---

## Authentication

All `/api/*` routes (except `/api/auth/signin` and `/api/auth/signup`) require a **Bearer token**.

```
Authorization: Bearer <token>
```

Obtain a token via `POST /api/auth/signin`.

---

## API Reference

### Auth

| Method | Endpoint           | Body                                     | Description          |
|--------|--------------------|------------------------------------------|----------------------|
| POST   | /api/auth/signup   | name, email, password, barangay          | Create admin account |
| POST   | /api/auth/signin   | email, password                          | Sign in, get token   |
| GET    | /api/auth/me       | —                                        | Current user info    |

---

### Dashboard

| Method | Endpoint        | Description                                  |
|--------|-----------------|----------------------------------------------|
| GET    | /api/dashboard  | Stats, recent registrations, activity feed   |

**Response:**
```json
{
  "stats": { "total": 6, "vaccinated": 4, "lostFound": 1, "adoption": 1, "coverage": 67 },
  "recentAnimals": [...],
  "activityFeed": [...]
}
```

---

### Animals

| Method | Endpoint            | Query Params         | Description               |
|--------|---------------------|----------------------|---------------------------|
| GET    | /api/animals        | q, species, status   | List / search animals     |
| GET    | /api/animals/:id    | —                    | Get animal + vaccinations |
| POST   | /api/animals        | body (see below)     | Register new animal       |
| PUT    | /api/animals/:id    | body (partial OK)    | Update animal             |
| DELETE | /api/animals/:id    | —                    | Remove animal             |

**POST / PUT body fields:**
```json
{
  "name": "Chollo",
  "breed": "Aspin",
  "species": "Dog",
  "color": "Brown",
  "sex": "Male",
  "age": "2 years",
  "owner_id": 1,
  "owner_name": "Juan Dela Cruz",
  "vax_status": "Vaccinated",
  "notes": ""
}
```

---

### Owners

| Method | Endpoint         | Description         |
|--------|------------------|---------------------|
| GET    | /api/owners      | List owners (q=)    |
| GET    | /api/owners/:id  | Owner + their pets  |
| POST   | /api/owners      | Add owner           |
| PUT    | /api/owners/:id  | Update owner        |
| DELETE | /api/owners/:id  | Delete owner        |

---

### Vaccinations

| Method | Endpoint               | Description                         |
|--------|------------------------|-------------------------------------|
| GET    | /api/vaccinations      | List all (filter: ?animal_id=)      |
| GET    | /api/vaccinations/:id  | Get single record                   |
| POST   | /api/vaccinations      | Log vaccination                     |
| DELETE | /api/vaccinations/:id  | Delete record                       |

**POST body:**
```json
{
  "animal_id": 1,
  "vaccine": "Anti-Rabies",
  "given_by": "Dr. Ramos",
  "given_at": "2026-05-21",
  "next_due": "2027-05-21",
  "notes": ""
}
```

---

### Lost & Found

| Method | Endpoint                      | Description                   |
|--------|-------------------------------|-------------------------------|
| GET    | /api/lost-found               | List (filter: type, status)   |
| GET    | /api/lost-found/:id           | Get report                    |
| POST   | /api/lost-found               | File a report                 |
| PATCH  | /api/lost-found/:id/resolve   | Mark as resolved              |
| DELETE | /api/lost-found/:id           | Remove report                 |

**POST body:**
```json
{
  "animal_id": 4,
  "type": "lost",
  "description": "Orange Siamese",
  "last_seen": "Near plaza",
  "reporter": "Ana Lopez",
  "contact": "09501234567"
}
```

---

### Adoptions

| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| GET    | /api/adoptions              | List (filter: status)|
| GET    | /api/adoptions/:id          | Get listing          |
| POST   | /api/adoptions              | Add listing          |
| PATCH  | /api/adoptions/:id/adopt    | Mark as adopted      |
| DELETE | /api/adoptions/:id          | Remove listing       |

---

### Scan Reports

| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| GET    | /api/scan-reports | All scan logs      |
| POST   | /api/scan-reports | Log a scan         |

---

### Users (Admin Management)

| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| GET    | /api/users     | List all admins    |
| POST   | /api/users     | Add admin user     |
| PUT    | /api/users/:id | Update user        |
| DELETE | /api/users/:id | Delete user        |

---

## Connecting the Frontend

Replace the `localStorage` / `sessionStorage` calls in the frontend JS files with `fetch` calls to this API.

**Example — Sign In (auth.js):**
```js
const res  = await fetch('http://localhost:3000/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
sessionStorage.setItem('brgy_token', data.token);
sessionStorage.setItem('brgy_user_name', data.user.name);
window.location.href = 'dashboard.html';
```

**Example — Load animals (registry.js):**
```js
const token = sessionStorage.getItem('brgy_token');
const res   = await fetch('http://localhost:3000/api/animals', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const animals = await res.json();
renderTable(animals);
```

---

## Project Structure

```
brgy-pet-backend/
├── src/
│   ├── server.js              ← Express app entry point
│   ├── db/
│   │   ├── database.js        ← SQLite schema & connection
│   │   └── seed.js            ← Sample data + default admin
│   ├── middleware/
│   │   └── auth.js            ← JWT sign / verify
│   └── routes/
│       ├── auth.js
│       ├── animals.js
│       ├── owners.js
│       ├── vaccinations.js
│       ├── lostFound.js
│       ├── adoptions.js
│       ├── scanReports.js
│       ├── users.js
│       └── dashboard.js
├── public/                    ← Drop your frontend HTML here
├── brgy_pet.db                ← Auto-created on first run
└── package.json
```

## Environment Variables

| Variable    | Default                          | Description             |
|-------------|----------------------------------|-------------------------|
| PORT        | 3000                             | Server port             |
| JWT_SECRET  | brgy_pet_dev_secret_change_in_prod | JWT signing secret    |

For production, set `JWT_SECRET` to a long random string.
