# ELMS — Employee Learning Management System

> **Portfolio & Architecture Showcase**: ELMS is an enterprise-style internal Employee Learning Management System simulation built to demonstrate production-grade fullstack software engineering with **React 19**, **TypeScript**, **Laravel**, and **PostgreSQL** under a **Modular Monolith** architecture.
>
> *Disclaimer: This project is an independent technical portfolio prototype and is NOT an official government system or affiliated with any government agency.*

---

## 1. Project Overview

ELMS simulates an internal learning and competency development portal for an enterprise or public-sector organization. It provides a comprehensive learning lifecycle: employees browse accredited courses, enroll, consume structured learning materials, undergo scored quiz assessments, earn certificates of completion, and track learning analytics through role-scoped reports.

### Architectural Highlights
- **Modular Monolith**: Backend organized into high-cohesion, loosely-coupled business domains (`Authentication`, `Users`, `Courses`, `Learning`, `Assessments`, `Certificates`, `Reports`, `Notifications`).
- **Zero Frontend Aggregation**: Client application strictly consumes authoritative server-computed statistics; no synthetic metrics or client-side averages computed over paginated datasets.
- **Strict Role-Based Access Control (RBAC)**: Enforced via Laravel Sanctum, Route Middleware, Form Requests, and Eloquent Policies with layered defense in frontend React routes.
- **Assessment Integrity**: Quiz answer keys (`is_correct`) are securely stripped by the backend during active attempts and only released upon submission for review.
- **High Test Coverage**: 197 frontend tests (Vitest + React Testing Library across 39 test suites) and 284 backend tests / 1,146 assertions (PHPUnit).

---

## 2. Key Features

- **Authentication & RBAC**: Self-registration for employees (`/register`), password reset lifecycle (`/forgot-password`, `/reset-password` with token verification & anti-enumeration), and token-based authentication via Laravel Sanctum with 4 discrete roles: `SUPER_ADMIN`, `LEARNING_ADMIN`, `INSTRUCTOR`, and `EMPLOYEE`. Quick-fill demo account switcher on login.
- **Role-Aware Dashboard**: Dynamic executive metrics adapted per role (4 employee cards, 4 instructor performance cards, 6 institutional admin cards).
- **Course Authoring & Curriculum Management**: Role-scoped course authoring dashboard (`/admin/courses`), draft course creation (`/admin/courses/create`), and tabbed course editor (`/admin/courses/:courseId/edit`) supporting module outline management, text/video/document materials CRUD with mandatory completion toggles, course metadata updates, instructor assignments (Admin-only), and strict lifecycle state transitions (`DRAFT → PUBLISHED → ARCHIVED`).
- **Course Catalog & Syllabus**: Searchable and category-filtered course catalog with dynamic call-to-action ("Enroll in Course" vs. "Continue Learning") and detailed syllabus preview.
- **Learning Player**: Distraction-free interactive learning environment supporting text reading, PDF document viewer, and video embedding, with idempotent progress tracking.
- **Quiz Assessments**: Multi-phase evaluation flow (Instructions & Quota → Timed Attempt → Instant Scored Result & Answer Review).
- **Certificates & Certificate of Completion**: Server-validated certificate issuance upon 100% mandatory material completion and passing required quizzes, with idempotent retrieval and print-ready document view (`window.print()`).
- **Reports & Analytics**: Role-scoped analytics for course completion rates, employee curriculum progress, and quiz evaluation score distributions.
- **In-App Notifications**: Transactional notification inbox for enrollment events, quiz grades, and certificate issuances.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 (`^19.2.0`) + TypeScript (`^5.7.2`)
- **Build Tool**: Vite (`^8.0.0`)
- **Server State**: TanStack React Query v5 (`^5.103.0`)
- **Routing**: React Router v7 (`^7.18.4`)
- **Styling**: Tailwind CSS v4 (`^4.0.0`) + Radix UI Primitives + Lucide Icons (`^0.475.0`)
- **HTTP Client**: Axios (`^1.20.0`)
- **Testing**: Vitest (`^4.1.11`) + Testing Library (React 16 / JSDOM)

### Backend
- **Framework**: Laravel 11/12 (`laravel/framework: ^13.17`)
- **Language**: PHP (`^8.3`)
- **Authentication**: Laravel Sanctum (`^4.3`)
- **Architecture**: Modular Monolith (`app/Modules/`)
- **Code Style**: Laravel Pint (`^1.27`)
- **Testing**: PHPUnit (`^12.5.23`)

### Database & Storage
- **Database**: PostgreSQL (`pgsql`, default port `5432`)
- **Schema**: 17 relational tables with strict foreign keys, composite unique constraints, and indexes
- **Assets**: Laravel Filesystem (local disk / cloud-ready abstraction)

---

## 4. Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 + TypeScript SPA                       │
│  resources/js/features/{auth, dashboard, courses, learning,            │
│                         assessments, certificates, reports}            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (/api/v1/*)
                                    │ Bearer Token (Laravel Sanctum)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Laravel Modular Monolith Backend                     │
│                                                                        │
│   app/Modules/                                                         │
│   ├── Authentication  (Login, Register, Password Reset, Token lifecycle)│
│   ├── Users           (Users, Roles, Departments)                      │
│   ├── Courses         (Courses, Categories, Modules, Materials)       │
│   ├── Learning        (Enrollments, Material Progress, Completion)     │
│   ├── Assessments     (Quizzes, Questions, Attempts, Scoring)          │
│   ├── Certificates    (Issuance, Eligibility, Ownership)               │
│   ├── Reports         (Dashboard KPIs, Course/Learner/Quiz Reports)    │
│   └── Notifications   (In-app notifications inbox)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Eloquent ORM / Transactions
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                             │
│       (17 relational tables, composite constraints, strict FKs)        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Core User Flows

### Employee (Learner) Flow
1. **Sign In**: Login as Employee (`employee@elms.test`).
2. **Dashboard**: Inspect current learning progress, enrolled courses, and earned certificates.
3. **Browse Catalog**: Navigate to `/courses`, apply category filters or search keywords.
4. **Course Details**: Review syllabus modules and click **"Enroll in Course"**.
5. **Learning Player**: Open `/my-learning/:enrollmentId`, read materials (`TEXT`, `PDF`, `VIDEO`), click **"Mark as Completed"** (progress bar updates in real time).
6. **Quiz Assessment**: Launch quiz from curriculum, answer questions (unbiased, answers hidden), submit attempt, inspect score and review feedback.
7. **Certificate**: Click **"Request Certificate"** (validates 100% completion + passing quiz), view the Certificate of Completion, and print to PDF.
8. **Personal Reports**: View personal learning timeline at `/reports/learning`. Unauthorized routes (`/reports/courses`, `/reports/quiz`) are guarded with HTTP 403 / Access Denied.

### Instructor & Administrator Flow
1. **Sign In**: Login as Instructor (`instructor@elms.test`), Learning Admin (`learningadmin@elms.test`), or Super Admin (`superadmin@elms.test`).
2. **Executive Dashboard**: Review institutional statistics (total employees, course completions, average assessment score).
3. **Course Authoring**: Navigate to `/admin/courses` to manage organizational courses:
   - **Create Course**: Click "+ Create Course" (`/admin/courses/create`), specify category, title, duration, and description (creates course in `DRAFT` state; instructors are automatically assigned).
   - **Structure Syllabus**: In `/admin/courses/:id/edit`, organize curriculum modules and attach learning materials (`TEXT`, `VIDEO`, `PDF`) with optional or mandatory completion toggles.
   - **Course Lifecycle**: Institutional Administrators publish draft courses directly (`DRAFT → PUBLISHED`) to expose them to learners, or retire courses (`PUBLISHED → ARCHIVED`) to prevent new enrollments while preserving historical progress.
   - **Instructor Assignments**: Institutional Administrators assign or remove instructors via the Instructors tab.
4. **Reporting Hub**: Access `/reports` to inspect course performance tables, cross-departmental learner progress, and quiz attempt distributions scoped to the authorized role.

---

## 6. Project Structure

```text
example-app/
├── app/
│   ├── Models/                         # Shared Eloquent models
│   └── Modules/                        # Modular Monolith domains
│       ├── Assessments/                # Quizzes, questions, attempts, scoring
│       ├── Authentication/             # Sanctum auth, login, logout, me
│       ├── Certificates/               # Certificate generation & authorization
│       ├── Courses/                    # Courses, categories, modules, materials
│       ├── Learning/                   # Enrollments, material progress
│       ├── Notifications/              # In-app notification management
│       ├── Reports/                    # Dashboard metrics, aggregated reports
│       └── Users/                      # Users, roles, departments
├── database/
│   ├── migrations/                     # 17 PostgreSQL schema migrations
│   └── seeders/                        # Comprehensive seeders with demo datasets
├── docs/                               # Architecture & API documentation
│   ├── api.md                          # REST API specifications (70 endpoints)
│   ├── architecture.md                 # System architecture documentation
│   ├── database.md                     # Schema & entity-relationship diagrams
│   ├── modules.md                      # Module boundaries & contracts
│   └── requirements.md                 # Functional & non-functional requirements
├── resources/
│   ├── css/app.css                     # Tailwind CSS entry
│   └── js/
│       ├── components/                 # Shared UI primitives (Radix, layout)
│       ├── features/                   # Feature-based domain modules
│       │   ├── assessments/            # Quiz flow, attempt review, question cards
│       │   ├── auth/                   # Login form, demo switcher
│       │   ├── certificates/           # Certificate document viewer, printing
│       │   ├── courses/                # Catalog, search filter, course detail
│       │   ├── dashboard/              # Role-tailored dashboard cards
│       │   ├── learning/               # Learning player, curriculum sidebar
│       │   └── reports/                # Course, learner, and quiz report tables
│       ├── router/                     # React Router routes & RBAC guards
│       ├── services/                   # Axios HTTP client & token interceptors
│       └── types/                      # TypeScript domain definitions
├── routes/
│   ├── api.php                         # API route orchestrator (/api/v1/*)
│   └── web.php                         # SPA catch-all blade mount
└── tests/
    ├── Feature/                        # PHPUnit integration test suite
    └── Unit/                           # PHPUnit domain test suite
```

---

## 7. Local Installation & Setup

### Prerequisites
- **PHP**: `^8.3` (with `pdo_pgsql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`)
- **Composer**: `^2.5`
- **Node.js**: `^20.x` or `^22.x` and `npm`
- **PostgreSQL**: `^14.x` or `^16.x`

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Fakhrirudin/elms.git
   cd elms/example-app
   ```

2. **Install PHP and Node dependencies**:
   ```bash
   composer install
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Open `.env` and configure your PostgreSQL database credentials:
   ```dotenv
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=elms_porto
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   ```

4. **Create the Database & Run Migrations with Seeders**:
   Ensure the PostgreSQL database `elms_porto` exists, then run:
   ```bash
   php artisan migrate --seed
   ```

5. **Build Frontend Assets**:
   ```bash
   npm run build
   ```

6. **Start Development Servers**:
   In separate terminal sessions:
   ```bash
   # Terminal 1: Laravel Backend
   php artisan serve --port=8000

   # Terminal 2: Vite Dev Server (optional for HMR development)
   npm run dev
   ```
   Access the application at `http://127.0.0.1:8000`.

---

## 8. Demo Accounts

The database seeder provisions pre-populated demo accounts for each role. All demo accounts share the same password:

| Role | Email | Password | Seeded Data & Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@elms.test` | `Password123!` | Full institutional access; course management; org-wide reporting. |
| **Learning Admin** | `learningadmin@elms.test` | `Password123!` | Course & curriculum management; org-wide learning and quiz reports. |
| **Instructor** | `instructor@elms.test` | `Password123!` | Instructor for "Arsitektur Web Enterprise"; assigned course reports. |
| **Employee (Primary)** | `employee@elms.test` | `Password123!` | **Siti Rahmawati**: 3 enrolled courses, completed quiz attempt, 1 issued certificate. |
| **Employee (Secondary)** | `ahmad.fauzi@elms.test` | `Password123!` | **Ahmad Fauzi**: 1 enrolled course (demonstrates cross-learner data isolation). |

> *Quick Login*: The login screen at `/login` provides one-click demo role selector buttons to autofill these credentials instantly.

---

## 9. Verification & Test Suite

The codebase enforces automated test coverage across both frontend and backend layers:

```bash
# Run Frontend Vitest Suite (152 tests across 33 test files)
npm test -- --run

# Run TypeScript Type Check (0 errors)
npm run types:check

# Run Backend PHPUnit Suite (245 tests, 1023 assertions)
php artisan test

# Check Backend Code Style with Laravel Pint (0 violations)
composer lint:check
```

### Verified Test Baseline
- **Frontend**: **152 passing tests** (33 test files)
  - Unit tests for services and React hooks
  - Component tests for tables, player, certificate document, quiz review, and 403 access boundaries
- **Backend**: **245 passing tests** with **1,023 assertions**
  - Authentication, Course management, Enrollment transactions, Concurrency-safe quiz attempts, Idempotent certificate issuance, Scoped reporting queries
- **Code Style**: 100% PSR-12 / Laravel Pint compliant.

---

## 10. Technical Documentation

For in-depth architectural and schema details, refer to the project documentation:
- [System Architecture](docs/architecture.md) — Modular monolith structure, state management, security boundaries.
- [REST API Reference](docs/api.md) — 70 endpoints with request payloads, responses, and authorization rules.
- [Database Design](docs/database.md) — Entity-relationship diagrams, table definitions, and index strategies.
- [Modules Specification](docs/modules.md) — Responsibilities, boundaries, and cross-module contracts.
- [System Requirements](docs/requirements.md) — Functional and non-functional requirements.

---

## 11. License

This project is open-source software licensed under the [MIT license](LICENSE).
