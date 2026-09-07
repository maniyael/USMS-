# USMS — University Student Management System

A full-stack student management system: **NestJS + TypeORM + PostgreSQL** backend and a **React 19 + Vite** frontend, managed as an npm monorepo.

## Modules

- **Admissions / Students** — student records, auto-generated student IDs (cohort code + running number), institutional emails, user accounts, status management, full profile (courses, grades, attendance, fees, documents).
- **Academics** — faculties, departments, programs, levels, cohorts, academic years (CRUD, admin-managed).
- **Courses & Curricula** — courses, curricula, curriculum-course mapping.
- **Enrollment** — bulk enrollment with dedupe, retakes, listing/filtering by course/student/status.
- **Timetable** — sessions with class type, day, time, location, lecturer; delete entries.
- **Attendance** — per-session attendance with congratulation (`present`/`late`/`absent`/`excused`/`medical`), course history, stats, student records.
- **Grades** — assessments (weighted), grade entry, draft → submitted → validated workflow, corrections with history, GPA computation (weighted, per-course and per-semester) against a configurable grading scale.
- **Finance** — student fees, payments with receipts, reversals, balances and statements.
- **Documents** — generated student documents (admission letters, transcripts, etc.).
- **Announcements / Notifications** — role-targeted posts (all / program / level / cohort); students get a per-student feed.
- **Reports** — summary dashboard, enrollment-by-program, grade distribution.
- **Admin** — role/permission management (52-permission catalog), audit log, user management.

## Tech stack

| Layer    | Choice                                            |
|----------|---------------------------------------------------|
| Backend  | Node.js 24, NestJS 11, TypeORM, Passport/JWT      |
| Database | PostgreSQL 17                                     |
| Frontend | React 19, react-router-dom 7, Vite, plain CSS     |
| Tests    | Jest + ts-jest (26 unit tests)                    |

## Prerequisites

- Node.js 24+ and npm 11+
- PostgreSQL 17 running locally
- A database named `usms` (created automatically if the configured user has rights to create it)

## Configuration

Backend settings live in `backend/.env` (see `backend/src/config/*.ts` for the option map):

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=usms
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=8h
PORT=3000
UNIV_NAME=Default University
UNIV_STUDENT_NO_PREFIX=25
UNIV_INITIAL_PASSWORD=changeme2026@
UNIV_DOMAIN=defaultuniversity.edu
```

## Running

```bash
# 1. install dependencies (from repo root)
npm install

# 2. build both workspaces
npm run build

# 3. start the API (port 3000, mounted under /api)
npm run start:prod --workspace backend

# 4. in another terminal, start the frontend dev server (port 5173, proxies /api -> :3000)
npm run dev --workspace frontend
```

Then open http://localhost:5173.

The backend seeds the database on first boot: super-admin role, the 52-permission catalog, five roles (super administrator, registrar, lecturer, finance officer, student), and a default admin account.

### Convenience scripts (root)

```bash
npm run build        # build backend + frontend
npm run test         # backend unit tests
npm run dev          # backend (watch) + frontend (watch)
npm run start        # build, then run backend on :3000
npm run lint         # eslint on backend
```

## Default accounts

| Role     | Username | Password        | Notes                                    |
|----------|----------|-----------------|------------------------------------------|
| Admin    | `admin`  | `changeme2026@` | All 52 permissions                       |
| Student  | —        | `changeme2026@` | Initial password; username is student ID |

Student/staff users are created through the app (Students / Staff pages), with their username derived from student ID (or staff number) and the university initial password.

## Tests

```bash
npm run test
```

Covers grading scale boundaries, weighted GPA, student-ID generation (format, gap filling, exhaustion), institutional email normalization, permission catalog integrity, and the GPA summary pipeline (weighted score → letter → GPA, attendance %, fee balance).

## API conventions

- Every route is behind JWT auth, prefixed with `/api`, and guarded by permissions (`@Permissions('module.action')`).
- List endpoints support `limit`, `search`, and module-specific filters.
- Errors use `{ statusCode, message, path }`.

## Directory layout

```
backend/
  src/modules/        feature modules (academics, students, courses, enrollment, ...)
  src/common/         guards, decorators, services (GPA, student ID, audit)
  src/constants/      permission catalog, grading scale
  src/seed/           role/permission/admin seeding
  test/stubs/         ESM stubs for unit tests
frontend/
  src/pages/          one file per screen
  src/components/     shared UI primitives
  src/auth.tsx        auth context + permission checks
  src/api.ts          fetch wrapper (token, /api prefix, error handling)
```