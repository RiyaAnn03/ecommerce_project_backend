# Ecommerce Backend (NestJS + Prisma + PostgreSQL)

Beginner-friendly backend starter for a clothing store website.

## What is inside?

- **NestJS** app (TypeScript) in `src/`
- **Prisma** setup in `prisma/` (connects to PostgreSQL)
- **PostgreSQL** database (you can manage it using **pgAdmin**)
- **Apollo Server (GraphQL)** at `/graphql` (Apollo Sandbox in browser)

Right now this repo is intentionally **simple**:
- It only has the default Nest route: `GET /` → “Hello World!”
- It has a simple **Auth GraphQL API**: `signup` + `login` (mobile + password)
- You can add more APIs (products, orders) step-by-step later

## Requirements

- **Node.js** (LTS recommended) + **npm**
- **PostgreSQL** running on your machine
- **pgAdmin** (optional, but useful to view your database)

## Setup (first time)

1) Install packages

```bash
npm install
```

2) Create `.env` (important)

- Create a file named `.env` in the project root
- Add these variables:
  - `DATABASE_URL` (your PostgreSQL connection string)
  - `PORT` (optional, default is 3000)
  - `JWT_SECRET` (any long random string, used for login tokens)

Notes:
- **`.env` is ignored by git**, so it will NOT be pushed to GitHub.
- In pgAdmin, ensure the database `ecommerce` exists (create it if needed).

## Run the backend

```bash
npm run start:dev
```

The server will start on `http://localhost:3000`.

### Open Apollo Sandbox (GraphQL)

- Open `http://localhost:3000/graphql`

Example queries:

- `signup`:

```graphql
mutation {
  signup(
    input: {
      firstName: "A"
      lastName: "B"
      mobile: "9999999999"
      password: "pass1234"
    }
  ) {
    token
    user {
      id
      firstName
      mobile
    }
  }
}
```

- `login`:

```graphql
mutation {
  login(mobile: "9999999999", password: "pass1234") {
    token
    user {
      id
      firstName
      mobile
    }
  }
}
```

- `me` (set HTTP header `Authorization: Bearer <token>`):

```graphql
query {
  me {
    id
    firstName
    lastName
    mobile
  }
}
```

## Prisma (database) commands

You will use these when you start creating tables/models in `prisma/schema.prisma`.

```bash
# Create tables + migration (after you add models)
npx prisma migrate dev

# Open Prisma Studio (database UI)
npx prisma studio

# Re-generate Prisma client (usually done automatically by migrate)
npx prisma generate
```

## Useful scripts

```bash
npm run build
npm run start
npm run start:dev
npm run test
npm run lint
```

## Push to GitHub (first time)

```bash
git add .
git commit -m "Initial NestJS + Prisma setup"
git remote add origin <YOUR_GITHUB_REPO_GIT_URL>
git push -u origin master
```
