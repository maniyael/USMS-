# USMS Backend

NestJS + TypeORM API for the University Student Management System. Serves at `http://localhost:3000/api` (global `/api` prefix).

See the [root README](../README.md) for setup, configuration, accounts, and the full script list.

## Local commands

```bash
npm run start:dev     # watch mode (port 3000)
npm run build         # tsc compile to dist/
npm run test          # jest unit tests (ts-jest)
npm run lint          # eslint --fix
```

## Layout

- `src/modules/` — feature modules (auth, students, staff, courses, enrollment, timetable, attendance, grades, finance, documents, academics, notifications, reports, admin, users, audit).
- `src/common/` — JWT/permission guards, decorators, GPA + student-ID services, audit service.
- `src/constants/` — full permission catalog (`permissions.ts`) and grading scale (`grading.ts`).
- `src/seed/` — seeds roles, the permission catalog, and the default admin.
- `test/stubs/nest-typeorm.ts` — Jest `moduleNameMapper` stub so unit tests don't load the ESM `@nestjs/typeorm` package.