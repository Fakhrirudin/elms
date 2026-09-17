# ELMS Architecture

## 1. Overview

ELMS (Employee Learning Management System) adalah aplikasi Learning Management System (LMS) internal yang digunakan untuk mendukung proses pembelajaran dan pengembangan kompetensi karyawan.

Aplikasi dibangun sebagai fullstack web application dengan pendekatan **Modular Monolith Architecture**.

Dokumen ini menjadi acuan utama untuk struktur aplikasi, pembagian module, komunikasi antar-layer, teknologi, security, dan architectural decision selama development.

---

## 2. Technology Stack

### Frontend

* React.js
* TypeScript
* Vite
* Tailwind CSS
* TanStack Query
* Axios

### Backend

* Laravel
* PHP
* Laravel Sanctum
* Laravel Eloquent ORM
* Form Request Validation
* Policies / Middleware

### Database

* PostgreSQL

### Development & Collaboration

* Git
* Docker
* Postman

### Architecture

* Modular Monolith
* REST API
* API Versioning

---

## 3. High-Level Architecture

```text
┌───────────────────────────────┐
│           Employee            │
│        Admin / Instructor     │
└───────────────┬───────────────┘
                │
                │ HTTP / HTTPS
                ▼
┌───────────────────────────────┐
│        React + TypeScript     │
│             SPA               │
│                               │
│  Features                     │
│  - Auth                       │
│  - Courses                    │
│  - Learning                   │
│  - Assessments                │
│  - Certificates               │
│  - Reports                    │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│       Laravel Backend         │
│                               │
│       Modular Monolith        │
│                               │
│ ┌───────────┐ ┌────────────┐ │
│ │   Auth    │ │   Users    │ │
│ ├───────────┤ ├────────────┤ │
│ │  Courses  │ │  Learning  │ │
│ ├───────────┤ ├────────────┤ │
│ │Assessment │ │Certificates│ │
│ ├───────────┤ ├────────────┤ │
│ │  Reports  │ │Notifications││
│ └───────────┘ └────────────┘ │
└───────────────┬───────────────┘
                │
                │ Eloquent / SQL
                ▼
┌───────────────────────────────┐
│          PostgreSQL           │
└───────────────────────────────┘

                │
                ▼
┌───────────────────────────────┐
│      Laravel Filesystem       │
│   PDF / Thumbnail / Assets    │
└───────────────────────────────┘
```

---

## 4. Architectural Style

ELMS menggunakan **Modular Monolith**.

Dalam pendekatan ini, seluruh backend masih berada dalam satu Laravel application dan satu deployment unit, tetapi kode dibagi berdasarkan **business capability/module**.

Module tidak dibentuk berdasarkan tabel database saja.

Contoh:

```text
Courses
├── Course management
├── Course publishing
├── Instructor assignment
└── Course catalog

Learning
├── Enrollment
├── Material completion
├── Learning progress
└── Course completion

Assessments
├── Quiz
├── Question
├── Option
├── Quiz attempt
└── Scoring
```

### Tujuan

* Memisahkan business domain
* Memudahkan maintenance
* Mengurangi coupling
* Memudahkan testing
* Memudahkan scaling di masa depan
* Tetap lebih sederhana daripada microservices

ELMS **tidak menggunakan microservices** pada MVP.

---

## 5. Backend Module Structure

Struktur utama backend:

```text
app/
├── Modules/
│   ├── Authentication/
│   ├── Users/
│   ├── Courses/
│   ├── Learning/
│   ├── Assessments/
│   ├── Certificates/
│   ├── Reports/
│   └── Notifications/
│
└── Shared/
    ├── Exceptions/
    ├── Responses/
    └── Helpers/
```

Setiap module bertanggung jawab terhadap business capability masing-masing.

Contoh:

```text
app/Modules/Courses/

├── Controllers/
├── Requests/
├── Services/
├── Models/
├── Policies/
└── Routes/
```

Struktur dapat berkembang apabila kompleksitas module meningkat.

Tidak semua module wajib memiliki semua folder.

---

## 6. Responsibility per Module

### Authentication

Bertanggung jawab terhadap:

* Login
* Logout
* Current authenticated user
* Password authentication
* Token/session management
* Authentication-related validation

---

### Users

Bertanggung jawab terhadap:

* User management
* Role
* Department
* Employee profile
* Activate/deactivate user
* User authorization

---

### Courses

Bertanggung jawab terhadap:

* Course CRUD
* Category
* Course status
* Instructor assignment
* Course publishing
* Module management
* Material management

---

### Learning

Bertanggung jawab terhadap:

* Course enrollment
* Employee learning flow
* Material completion
* Learning progress
* Course completion

---

### Assessments

Bertanggung jawab terhadap:

* Quiz
* Question
* Option
* Quiz attempt
* Quiz answer
* Score calculation
* Pass/fail evaluation
* Attempt limitation

---

### Certificates

Bertanggung jawab terhadap:

* Certificate generation
* Certificate number
* Certificate issuance
* Certificate retrieval
* Certificate verification in future enhancement

---

### Reports

Bertanggung jawab terhadap:

* Dashboard statistics
* Learning statistics
* Course completion statistics
* Quiz performance
* Employee learning reports

---

### Notifications

MVP:

Module disiapkan sebagai boundary untuk kebutuhan notification di masa depan.

Contoh future features:

* Course announcement
* Learning reminder
* Certificate notification
* Quiz reminder

Notification system bukan fokus utama MVP.

---

## 7. Backend Layering

Backend menggunakan pola:

```text
Request
   ↓
Controller
   ↓
Form Request
   ↓
Service
   ↓
Model / Eloquent
   ↓
PostgreSQL
```

Untuk authorization:

```text
Request
   ↓
Authentication
   ↓
Middleware / Policy
   ↓
Controller
   ↓
Service
```

### Controller

Controller bertanggung jawab terhadap:

* Menerima HTTP request
* Memanggil validation
* Memanggil service
* Mengembalikan API response

Controller tidak boleh menampung business logic yang kompleks.

Contoh yang dihindari:

```php
public function submit(Request $request)
{
    // 100+ lines of business logic
}
```

Lebih baik:

```php
public function submit(SubmitQuizRequest $request)
{
    $result = $this->quizService->submit(
        $request->user(),
        $request->validated()
    );

    return response()->json($result);
}
```

---

## 8. Service Layer

Business logic yang kompleks ditempatkan pada Service.

Contoh:

```text
QuizService
EnrollmentService
ProgressService
CertificateService
CourseService
```

Contoh responsibility:

### EnrollmentService

* Validate course availability
* Check duplicate enrollment
* Create enrollment
* Determine initial status

### ProgressService

* Calculate material completion
* Calculate course progress
* Determine course completion
* Update enrollment status

### QuizService

* Start attempt
* Validate attempt
* Submit answers
* Calculate score
* Determine pass/fail
* Check remaining attempts

### CertificateService

* Validate completion requirements
* Generate certificate number
* Create certificate record

---

## 9. Repository Pattern

Repository Pattern **tidak diwajibkan** untuk seluruh module.

Default approach:

```text
Controller
    ↓
Service
    ↓
Eloquent Model
```

Repository hanya digunakan jika terdapat kebutuhan yang memang membenarkan abstraction tambahan, misalnya:

* Query sangat kompleks
* Banyak sumber data
* Data access perlu diganti
* Query logic digunakan di banyak service

Jangan membuat repository hanya untuk mengikuti pattern tanpa kebutuhan nyata.

---

## 10. API Architecture

ELMS menggunakan REST API.

Base URL:

```text
/api/v1
```

Contoh:

```text
GET    /api/v1/courses
POST   /api/v1/courses
GET    /api/v1/courses/{id}
PUT    /api/v1/courses/{id}
DELETE /api/v1/courses/{id}
```

Authentication:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

API versioning digunakan untuk mengurangi risiko breaking changes pada client ketika API berkembang.

---

## 11. API Response Convention

Response berhasil menggunakan struktur konsisten.

Contoh:

```json
{
    "success": true,
    "message": "Course retrieved successfully",
    "data": {}
}
```

Untuk collection:

```json
{
    "success": true,
    "message": "Courses retrieved successfully",
    "data": [],
    "meta": {
        "current_page": 1,
        "per_page": 10,
        "total": 100
    }
}
```

Error:

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "title": [
            "The title field is required."
        ]
    }
}
```

---

## 12. HTTP Status Codes

API menggunakan HTTP status code sesuai kondisi.

| Status | Usage                                    |
| ------ | ---------------------------------------- |
| 200    | Successful request                       |
| 201    | Resource created                         |
| 204    | Successful request without response body |
| 400    | Bad request                              |
| 401    | Unauthenticated                          |
| 403    | Unauthorized                             |
| 404    | Resource not found                       |
| 422    | Validation error                         |
| 429    | Too many requests                        |
| 500    | Internal server error                    |

Response error tidak boleh mengekspos:

* SQL query
* Database credentials
* File system path
* Internal stack trace
* Sensitive application information

Detail error dicatat melalui server-side logging.

---

## 13. Frontend Architecture

Frontend menggunakan:

```text
React
+
TypeScript
+
Vite
+
TanStack Query
+
Axios
```

Struktur:

```text
resources/js/

├── features/
│   ├── auth/
│   ├── dashboard/
│   │   ├── types/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── pages/
│   ├── courses/
│   ├── learning/
│   ├── assessments/
│   ├── certificates/
│   └── reports/
│
├── components/
├── services/
├── hooks/
├── router/
└── types/
```

Pendekatan feature-based digunakan agar frontend tetap terorganisir berdasarkan business domain.

### Dashboard Feature Architecture (Task 14)
Dashboard mengonsumsi REST API `GET /api/v1/dashboard` secara role-aware:
* **Service:** `dashboardService.getDashboard()` via Axios client.
* **Server State:** `useDashboard()` TanStack Query hook (`queryKey: ['dashboard']`, `staleTime: 2m`).
* **Role-Aware Views:**
  * **EMPLOYEE:** Menampilkan 4 metrik (`total_courses`, `in_progress`, `completed`, `certificates`), status progress belajar, dan empty state.
  * **INSTRUCTOR:** Menampilkan 4 metrik pengajaran (`assigned_courses`, `total_enrollments`, `completed_courses`, `average_quiz_score`) dan ringkasan evaluasi.
  * **SUPER_ADMIN & LEARNING_ADMIN:** Menampilkan 6 metrik institusional (`total_employees`, `total_courses`, `published_courses`, `total_enrollments`, `completed_courses`, `average_quiz_score`) dan status katalog.

### Courses Feature Architecture (Task 15)
Katalog kursus dan detail kurikulum diimplementasikan secara modular pada `features/courses/`:
* **API Endpoints:**
  * `GET /api/v1/courses`: Katalog kursus berpaginasi dengan filter pencarian kata kunci, kategori, dan pengurutan (`sort_by`, `sort_direction`). Scoping visibilitas kursus mengikuti backend policy secara transparan (Employee hanya menerima `PUBLISHED`).
  * `GET /api/v1/categories`: Taksonomi kategori untuk filtering catalog.
  * `GET /api/v1/courses/{course}`: Detail metadata kursus, instruktur, dan durasi.
  * `GET /api/v1/courses/{course}/modules`: Kurikulum/silabus kursus terurut dengan daftar materi belajar (`TEXT`, `PDF`, `VIDEO`) serta status mandatory/optional.
* **Services & Server State:**
  * `courseService.ts`: Modul HTTP client Axios terpusat.
  * `useCourses()`: TanStack Query hook untuk katalog (`queryKey: ['courses', filters]`, `placeholderData: keepPrevious`).
  * `useCategories()`: TanStack Query hook untuk kategori (`queryKey: ['categories']`, `staleTime: 5m`).
  * `useCourseDetail()`: TanStack Query hook detail kursus (`queryKey: ['course', id]`).
  * `useCourseModules()`: TanStack Query hook silabus materi (`queryKey: ['course-modules', id]`).
* **Components & UX:**
  * `CourseCatalogPage.tsx`: Halaman katalog `/courses` dengan search debounce, category filter pills, sorting selector, responsive course card grid, loading skeletons, dan pagination controls.
  * `CourseDetailPage.tsx`: Halaman detail `/courses/:id` dengan hero metadata banner, thumbnail fallback, dan silabus terstruktur via `ModuleAccordion` & `MaterialItem`.

---

## 14. Frontend State Management

Tidak menggunakan Redux hanya untuk memenuhi kebutuhan architecture.

Pembagian state:

### Server State

Menggunakan TanStack Query.

Contoh:

* Courses
* Enrollments
* Learning progress
* Quiz results
* Certificates

### Local UI State

Menggunakan React `useState`.

Contoh:

* Modal open/close
* Form input sederhana
* Filter UI
* Toggle sidebar

### Shared Client State

React Context digunakan hanya jika memang dibutuhkan.

Contoh:

* Authentication context
* Theme
* Global UI state sederhana

---

## 15. Authentication & Authorization

Authentication menggunakan Laravel Sanctum.

Flow:

```text
User
 ↓
Login
 ↓
Laravel Authentication
 ↓
Sanctum
 ↓
Authenticated Request
 ↓
Middleware
 ↓
Policy / Authorization
 ↓
Controller
```

Authorization menggunakan kombinasi:

* Middleware
* Policies
* Role checking
* Business rules

Role MVP:

```text
SUPER_ADMIN
LEARNING_ADMIN
INSTRUCTOR
EMPLOYEE
```

Authorization harus dilakukan pada backend.

Frontend role checking hanya digunakan untuk UI experience dan bukan sebagai security boundary.

---

## 16. Security Principles

Security menjadi tanggung jawab backend dan frontend.

### Authentication

* Password menggunakan hashing
* Session/token menggunakan mekanisme Laravel
* Logout harus invalidate authentication state

### Authorization

Setiap protected resource harus memvalidasi permission user.

### Validation

Input divalidasi menggunakan Laravel Form Request.

### Database

Gunakan:

* Eloquent
* Parameterized query
* Query Builder

Hindari raw SQL jika tidak diperlukan.

### File Upload

File upload harus melakukan validasi:

* MIME type
* Extension
* File size
* Storage location

### Rate Limiting

Endpoint sensitif seperti login dapat diberikan rate limiting.

### XSS

Input dan output harus diproses secara aman.

### CSRF

Protection mengikuti mekanisme Laravel/Sanctum sesuai authentication flow.

---

## 17. Database Architecture

Database menggunakan PostgreSQL.

Database schema dijelaskan secara lengkap pada:

```text
docs/database.md
```

Database menjadi persistence layer untuk:

* Users
* Roles
* Departments
* Courses
* Modules
* Materials
* Enrollments
* Progress
* Quizzes
* Quiz attempts
* Certificates

Progress percentage tidak disimpan sebagai nilai permanen.

Progress dihitung berdasarkan data completion.

---

## 18. File Storage Architecture

Database hanya menyimpan metadata/path file.

Contoh:

```text
materials.file_path
courses.thumbnail
```

Binary file disimpan menggunakan Laravel Filesystem.

MVP:

```text
Local Storage
```

Future:

```text
S3-compatible Object Storage
```

Dengan pendekatan ini, database tidak menyimpan binary file secara langsung.

---

## 19. Transaction Management

Database transaction digunakan untuk operasi yang membutuhkan atomicity.

Contoh:

### Quiz Submission

```text
BEGIN TRANSACTION

Create Quiz Attempt
        ↓
Save Quiz Answers
        ↓
Calculate Score
        ↓
Determine Pass/Fail
        ↓
Update Attempt

COMMIT
```

Jika salah satu proses gagal:

```text
ROLLBACK
```

### Course Completion

Jika seluruh mandatory material selesai:

```text
Calculate Progress
        ↓
100%?
   ↓ Yes
Check Required Quiz
        ↓
Quiz Passed?
   ↓ Yes
Mark Enrollment Completed
        ↓
Generate Certificate
```

Operasi yang berhubungan dengan perubahan status completion dan certificate harus dilakukan secara konsisten dalam transaction bila diperlukan.

---

## 20. Module Boundaries

Setiap module harus memiliki responsibility yang jelas.

Contoh:

```text
Courses
    ↓
Learning
    ↓
Assessments
    ↓
Certificates
```

Dependency antar-module harus seminimal mungkin.

Hindari:

```text
CourseService
    ↓
QuizService
    ↓
CourseService
```

yang dapat menyebabkan circular dependency.

Jika module membutuhkan data module lain, gunakan interface/service contract atau mekanisme yang tetap menjaga boundary.

---

## 21. Business Logic Principles

Business logic tidak boleh tersebar secara acak pada:

* Controller
* React component
* Migration
* Model accessor yang terlalu kompleks

Business rule utama harus berada pada backend service/domain layer.

Contoh:

> Employee hanya dapat enroll course dengan status PUBLISHED.

Rule tersebut harus divalidasi oleh backend meskipun frontend sudah menyembunyikan course yang belum published.

---

## 22. Error Handling

Frontend harus menangani error API secara konsisten.

Contoh:

```text
401 → Redirect/login ulang
403 → Tampilkan unauthorized
404 → Resource tidak ditemukan
422 → Tampilkan validation error
429 → Tampilkan rate-limit message
500 → Tampilkan generic server error
```

Frontend tidak menampilkan informasi internal backend.

---

## 23. Logging

Server-side logging digunakan untuk membantu debugging dan monitoring.

Log dapat digunakan untuk:

* Application error
* Exception
* Failed transaction
* Important system event

Sensitive information tidak boleh ditulis ke log.

Contoh yang tidak boleh dilog:

* Password
* Authentication token
* Database password
* Sensitive personal information

---

## 24. Testing Strategy

Testing dibagi menjadi beberapa level.

### Unit Test

Digunakan untuk business logic tertentu.

Contoh:

```text
ProgressService
QuizService
CertificateService
```

### Feature Test

Digunakan untuk API/business flow.

Contoh:

```text
Login
Create Course
Enroll Course
Complete Material
Submit Quiz
Generate Certificate
```

### Frontend Test

Digunakan untuk component/feature penting apabila diperlukan.

### Critical Business Rules

Minimal harus memiliki test untuk:

1. Employee tidak dapat enroll course DRAFT.
2. Employee tidak dapat duplicate enrollment.
3. Progress hanya menghitung material yang relevan.
4. Course tidak dapat completed sebelum mandatory material selesai.
5. Quiz score dihitung dengan benar.
6. Attempt dibatasi sesuai `max_attempts`.
7. Certificate hanya dibuat jika progress 100% dan quiz passed.

---

## 25. Git Workflow

Git digunakan sebagai version control.

Branch utama:

```text
main
```

Development branch dapat menggunakan:

```text
develop
```

Feature branch:

```text
feature/authentication
feature/course-management
feature/enrollment
feature/quiz
feature/certificate
```

Bug fix:

```text
fix/quiz-scoring
fix/course-progress
```

Commit message menggunakan format yang jelas.

Contoh:

```text
feat: add course management API
feat: implement employee enrollment
feat: add quiz submission flow
fix: prevent duplicate enrollment
test: add certificate completion tests
docs: update API documentation
```

---

## 26. Development Workflow

Setiap feature dikembangkan dengan urutan:

```text
Requirement
    ↓
Database
    ↓
API
    ↓
Validation
    ↓
Authorization
    ↓
Business Logic
    ↓
Frontend
    ↓
Testing
    ↓
Documentation
```

Developer tidak langsung mengubah banyak bagian aplikasi tanpa memahami requirement dan existing architecture.

---

## 27. Definition of Done

Sebuah feature dianggap selesai apabila:

* Requirement sudah jelas
* Database sesuai kebutuhan
* API tersedia
* Validation tersedia
* Authorization tersedia
* Business logic terimplementasi
* Frontend terintegrasi
* Error handling tersedia
* Critical test tersedia
* Tidak menyebabkan regression
* Documentation diperbarui
* Git commit dibuat dengan jelas

---

## 28. Scalability Considerations

MVP tetap menggunakan Modular Monolith untuk menjaga kompleksitas tetap rendah.

Namun boundary module dirancang agar memungkinkan evolusi di masa depan.

Contoh:

```text
Current

Laravel Modular Monolith
        │
        ├── Courses
        ├── Learning
        ├── Assessments
        └── Certificates


Future

Laravel Modular Monolith
        │
        ├── Courses
        ├── Learning
        └── Assessments

External Service
        │
        └── Notification
```

Microservices hanya dipertimbangkan apabila terdapat kebutuhan nyata seperti:

* Independent scaling
* Independent deployment
* High workload pada module tertentu
* Team ownership yang terpisah
* Infrastruktur yang mendukung

Microservices bukan target MVP.

---

## 29. Architecture Decision Summary

| Decision               | Choice                               | Reason                                           |
| ---------------------- | ------------------------------------ | ------------------------------------------------ |
| Architecture           | Modular Monolith                     | Maintainability tanpa kompleksitas microservices |
| Frontend               | React + TypeScript                   | Sesuai requirement dan type safety               |
| Backend                | Laravel                              | Sesuai requirement dan produktif untuk REST API  |
| Database               | PostgreSQL                           | Sesuai requirement                               |
| API                    | REST `/api/v1`                       | Standard dan mudah diintegrasikan                |
| Authentication         | Laravel Sanctum                      | Native Laravel solution                          |
| ORM                    | Eloquent                             | Integrasi database yang sederhana                |
| Validation             | Form Request                         | Separation of concerns                           |
| Authorization          | Policy + Middleware                  | Backend security                                 |
| Server state           | TanStack Query                       | Cache dan synchronization API                    |
| Client state           | React state/Context                  | Hindari unnecessary complexity                   |
| Repository             | Optional                             | Digunakan hanya jika justified                   |
| File storage           | Laravel Filesystem                   | Database hanya menyimpan metadata                |
| Architecture evolution | Modular Monolith → possible services | Berdasarkan kebutuhan nyata                      |

---

## 30. Source of Truth

Dokumen berikut memiliki tanggung jawab masing-masing:

```text
docs/requirements.md
    ↓
Business requirements

docs/architecture.md
    ↓
System architecture

docs/database.md
    ↓
Database schema

docs/modules.md
    ↓
Module responsibilities

docs/api.md
    ↓
API contract
```

Perubahan architecture harus memperbarui dokumentasi terkait sebelum atau bersamaan dengan implementasi.

Dokumentasi dan implementasi harus dijaga tetap sinkron.

---

## 31. Development Principle

Prinsip utama development ELMS:

> Build simple, modular, maintainable, and testable software.

Prioritas:

1. Correctness
2. Security
3. Maintainability
4. Testability
5. Performance
6. Scalability

Jangan menambahkan abstraction, dependency, atau architecture pattern hanya untuk terlihat kompleks.

Setiap technical decision harus memiliki alasan yang jelas.
