# ELMS Modules

## 1. Overview

ELMS menggunakan pendekatan **Modular Monolith**.

Module dibagi berdasarkan **business capability**, bukan berdasarkan jumlah tabel database.

Setiap module memiliki tanggung jawab yang jelas dan harus menjaga dependency agar tidak terlalu erat dengan module lainnya.

Module utama:

```text
Authentication
Users
Courses
Learning
Assessments
Certificates
Reports
Notifications
```

---

# 2. Module Overview

| Module         | Responsibility                     | MVP    |
| -------------- | ---------------------------------- | ------ |
| Authentication | Login, logout, authenticated user  | Yes    |
| Users          | User, role, department management  | Yes    |
| Courses        | Course, category, module, material | Yes    |
| Learning       | Enrollment dan learning progress   | Yes    |
| Assessments    | Quiz, question, attempt, scoring   | Yes    |
| Certificates   | Certificate generation             | Yes    |
| Reports        | Dashboard dan learning reports     | Yes    |
| Notifications  | Notification infrastructure        | Future |

---

# 3. Authentication Module

## Purpose

Mengelola proses authentication user terhadap aplikasi.

## Responsibilities

* Login
* Logout
* Current authenticated user
* Password authentication
* Authentication state
* Sanctum authentication
* Authentication validation

## Main Components

```text
app/Modules/Authentication/

├── Controllers/
├── Requests/
├── Services/
└── Routes/
```

## Main Endpoints

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Rules

* User harus memiliki email dan password yang valid.
* User inactive tidak dapat login.
* Password tidak pernah dikembalikan melalui API.
* Authentication dilakukan di backend.
* Endpoint protected membutuhkan authentication.

---

# 4. Users Module

## Purpose

Mengelola user, role, dan department dalam sistem.

## Responsibilities

* User CRUD
* Role management
* Department management
* Employee profile
* Activate/deactivate user
* User authorization support

## Main Entities

```text
User
Role
Department
```

## Structure

```text
app/Modules/Users/

├── Controllers/
├── Requests/
├── Services/
├── Models/
├── Policies/
└── Routes/
```

## Main Operations

### User

```text
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
PATCH  /api/v1/users/{id}/status
```

### Department

```text
GET    /api/v1/departments
POST   /api/v1/departments
PUT    /api/v1/departments/{id}
```

## Rules

* Email harus unique.
* Employee number harus unique jika diisi.
* User inactive tidak dapat login.
* Role menentukan authorization.
* Password harus disimpan menggunakan hashing.
* User tidak boleh mengubah permission dirinya sendiri secara bebas.

---

# 5. Courses Module

## Purpose

Mengelola katalog pembelajaran.

Course module merupakan salah satu module utama ELMS.

## Responsibilities

* Category management
* Course CRUD
* Course publishing
* Instructor assignment
* Module management
* Material management
* Course ordering
* Course status

## Main Entities

```text
Category
Course
CourseInstructor
Module
Material
```

## Course Lifecycle

```text
DRAFT
  ↓
PUBLISHED
  ↓
ARCHIVED
```

Course hanya dapat diakses sebagai course pembelajaran apabila statusnya:

```text
PUBLISHED
```

## Course Structure

```text
Course
 ├── Category
 ├── Instructor(s)
 └── Modules
      ├── Materials
      ├── Materials
      └── Quiz
```

## Course Structure API

```text
GET    /api/v1/courses
POST   /api/v1/courses
GET    /api/v1/courses/{id}
PUT    /api/v1/courses/{id}
DELETE /api/v1/courses/{id}
PATCH  /api/v1/courses/{id}/status
```

## Module API

```text
POST   /api/v1/courses/{course}/modules
PUT    /api/v1/modules/{module}
DELETE /api/v1/modules/{module}
PATCH  /api/v1/courses/{course}/modules/reorder
```

## Material API

```text
POST   /api/v1/modules/{module}/materials
PUT    /api/v1/materials/{material}
DELETE /api/v1/materials/{material}
PATCH  /api/v1/modules/{module}/materials/reorder
```

## Rules

* Course harus memiliki category.
* Course memiliki satu atau lebih module.
* Module dimiliki oleh satu course.
* Material dimiliki oleh satu module.
* Material memiliki type:

  * TEXT
  * PDF
  * VIDEO
* `sort_order` digunakan untuk menentukan urutan.
* Hanya course PUBLISHED yang tersedia untuk employee.
* Instructor hanya dapat mengelola course yang ditugaskan kepadanya.
* Learning Admin dapat mengelola course sesuai permission.

---

# 6. Learning Module

## Purpose

Mengelola proses employee mengikuti course.

## Responsibilities

* Course enrollment
* Enrollment status
* Material completion
* Learning progress
* Course completion

## Main Entities

```text
Enrollment
MaterialProgress
```

## Enrollment Lifecycle

```text
ENROLLED
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

## Enrollment API

```text
GET  /api/v1/my-courses
POST /api/v1/courses/{course}/enroll
GET  /api/v1/enrollments/{enrollment}
```

## Learning API

```text
GET   /api/v1/enrollments/{enrollment}/progress
POST  /api/v1/enrollments/{enrollment}/materials/{material}/complete
```

## Rules

### Enrollment

* Employee hanya dapat enroll course PUBLISHED.
* Satu employee tidak dapat memiliki duplicate enrollment pada course yang sama.
* Enrollment dibuat dengan status `ENROLLED`.

### Progress

Progress dihitung berdasarkan material yang selesai.

Contoh:

```text
Total mandatory materials = 10
Completed materials = 6

Progress = 6 / 10 × 100
         = 60%
```

Progress tidak disimpan sebagai percentage permanen di database.

### Course Completion

Course hanya dapat menjadi `COMPLETED` jika:

```text
Mandatory material completion = 100%
AND
Required quiz = PASSED
```

Jika course tidak memiliki required quiz, maka completion cukup berdasarkan mandatory material.

---

# 7. Assessments Module

## Purpose

Mengelola assessment atau quiz dalam course.

## Responsibilities

* Quiz management
* Question management
* Option management
* Quiz attempt
* Answer submission
* Score calculation
* Pass/fail determination
* Attempt limitation

## Main Entities

```text
Quiz
Question
Option
QuizAttempt
QuizAnswer
```

## Quiz Flow

```text
Start Quiz
    ↓
Create Attempt
    ↓
Answer Questions
    ↓
Submit Quiz
    ↓
Calculate Score
    ↓
Determine Pass/Fail
    ↓
Update Attempt
```

## Quiz API

```text
GET    /api/v1/quizzes/{quiz}
POST   /api/v1/quizzes/{quiz}/attempts
GET    /api/v1/attempts/{attempt}
POST   /api/v1/attempts/{attempt}/submit
```

## Quiz Management API

```text
POST   /api/v1/modules/{module}/quizzes
PUT    /api/v1/quizzes/{quiz}
DELETE /api/v1/quizzes/{quiz}

POST   /api/v1/quizzes/{quiz}/questions
PUT    /api/v1/questions/{question}
DELETE /api/v1/questions/{question}
```

## Rules

* Quiz memiliki passing grade.
* Quiz memiliki maximum attempts.
* Setiap question harus memiliki option.
* Setiap question memiliki tepat satu correct option untuk tipe multiple choice MVP.
* User tidak dapat melebihi `max_attempts`.
* Score dihitung oleh backend.
* Client tidak boleh menentukan score sendiri.
* Attempt yang sudah submitted tidak dapat diubah.
* Selected option harus berasal dari question yang sesuai.
* Quiz submission menggunakan database transaction.

## Score Example

Misalnya:

```text
Total questions = 10
Correct answers = 8

Score = 8 / 10 × 100
      = 80
```

Jika:

```text
Passing grade = 70
Score = 80
```

Maka:

```text
PASSED
```

---

# 8. Certificates Module

## Purpose

Mengelola certificate yang diperoleh employee setelah menyelesaikan course.

## Responsibilities

* Certificate eligibility
* Certificate generation
* Certificate number
* Certificate issuance
* Certificate retrieval

## Main Entity

```text
Certificate
```

## Certificate Flow

```text
Course Progress
      ↓
     100%
      ↓
Check Required Quiz
      ↓
Quiz Passed?
      ↓
     YES
      ↓
Generate Certificate
```

## Certificate API

```text
POST /api/v1/enrollments/{enrollment}/certificate
GET  /api/v1/my-certificates
GET  /api/v1/certificates
GET  /api/v1/certificates/{certificate}
```

Future:

```text
GET /api/v1/certificates/verify/{certificateNumber}
```

## Rules

Certificate dapat diterbitkan apabila:

```text
Mandatory materials = 100%
AND
Required published quizzes = PASSED (atau tidak ada quiz di course)
```

Saat certificate diterbitkan, status enrollment akan ditransisikan menjadi `COMPLETED` dan `completed_at` akan diisi.

Jika enrollment sudah memiliki certificate, request berikutnya akan mengembalikan certificate yang sudah ada secara idempotent.

Certificate number harus unique dengan format concurrency-safe (`ELMS-YYYY-XXXXXX`).

Satu enrollment hanya menghasilkan satu certificate.

---

# 9. Reports Module

## Purpose

Menyediakan informasi statistik dan reporting untuk user yang memiliki permission.

## Responsibilities

* Dashboard statistics
* Course statistics
* Enrollment statistics
* Completion statistics
* Quiz performance
* Learning reports

## Employee Dashboard

Employee dapat melihat:

```text
My Courses
In Progress
Completed Courses
Certificates
```

## Admin Dashboard

Admin dapat melihat:

```text
Total Employees
Total Courses
Published Courses
Total Enrollments
Completed Courses
Average Quiz Score
```

## Example API

```text
GET /api/v1/dashboard
GET /api/v1/reports/courses
GET /api/v1/reports/learning
GET /api/v1/reports/quiz
```

## Rules

* Report hanya dapat diakses oleh role yang memiliki permission.
* Employee hanya dapat melihat data learning miliknya sendiri.
* Admin dapat melihat aggregated learning data sesuai authorization.

---

# 10. Notifications Module

## Status

Future enhancement.

Module ini belum menjadi fokus MVP.

## Potential Responsibilities

* Course announcement
* Learning reminder
* Quiz reminder
* Certificate notification
* System notification

Potential implementation:

```text
Database Notification
Email
Queue
External Notification Service
```

Tidak perlu mengimplementasikan notification system kompleks pada MVP.

---

# 11. Cross-Module Interaction

Module dapat berinteraksi dengan module lain tetapi harus menjaga boundary.

Contoh enrollment:

```text
Employee
   ↓
Learning Module
   ↓
Courses Module
   ↓
Check Course Status
   ↓
PUBLISHED?
   ↓
Create Enrollment
```

Contoh certificate:

```text
Learning Module
       ↓
Course Completed
       ↓
Certificates Module
       ↓
Check Eligibility
       ↓
Generate Certificate
```

Contoh quiz:

```text
Learning
   ↓
Assessments
   ↓
Submit Quiz
   ↓
Score
   ↓
Learning
   ↓
Update Course Completion
```

---

# 12. Dependency Rules

Dependency antar module harus dijaga.

### Allowed

```text
Learning → Courses
Learning → Assessments
Certificates → Learning
Reports → Learning
Reports → Assessments
```

### Avoid

```text
Courses → Certificates
Certificates → Courses
```

jika dependency tersebut tidak benar-benar diperlukan.

Circular dependency harus dihindari.

---

# 13. Shared Layer

Shared layer berisi functionality yang memang digunakan oleh beberapa module.

Structure:

```text
app/Shared/

├── Exceptions/
├── Responses/
└── Helpers/
```

## Exceptions

Digunakan untuk application-level exceptions yang bersifat shared.

## Responses

Digunakan untuk menjaga format API response tetap konsisten.

Contoh:

```text
ApiResponse
ApiErrorResponse
```

## Helpers

Hanya berisi helper yang benar-benar generic.

Jangan memasukkan business logic module ke Shared.

Contoh yang tidak diperbolehkan:

```text
Shared/CourseHelper
Shared/QuizHelper
Shared/EnrollmentHelper
```

jika helper tersebut sebenarnya hanya digunakan oleh satu module.

---

# 14. Module Folder Convention

Default structure:

```text
app/Modules/{Module}/

├── Controllers/
├── Requests/
├── Services/
├── Models/
├── Policies/
└── Routes/
```

Tidak semua module harus memiliki seluruh folder.

Contoh module sederhana:

```text
Authentication/

├── Controllers/
├── Requests/
├── Services/
└── Routes/
```

Jika sebuah module membutuhkan tambahan abstraction, folder dapat ditambahkan sesuai kebutuhan.

Contoh:

```text
Repositories/
Contracts/
DTOs/
Resources/
```

Tetapi jangan menambahkan layer tanpa alasan.

---

# 15. Frontend Module Mapping

Backend module dipetakan ke frontend feature.

```text
Backend                  Frontend

Authentication    →      features/auth
Users             →      features/users
Courses           →      features/courses
Learning          →      features/learning
Assessments       →      features/assessments
Certificates      →      features/certificates
Reports           →      features/reports
```

Frontend tidak harus memiliki struktur folder yang identik 100% dengan backend.

Yang penting business capability tetap konsisten.

---

# 16. Role and Module Access

## Super Admin

Access:

```text
Authentication
Users
Courses
Learning
Assessments
Certificates
Reports
```

Full system access.

---

## Learning Admin

Access:

```text
Courses
Learning
Assessments
Certificates
Reports
```

Tidak memiliki akses penuh terhadap system-level administration.

---

## Instructor

Access:

```text
Courses
Assessments
Learning
Reports
```

Dengan batasan hanya terhadap course yang ditugaskan.

---

## Employee

Access:

```text
Courses
Learning
Assessments
Certificates
```

Employee tidak dapat melakukan administrative CRUD.

---

# 17. Authorization Matrix

| Feature              | Super Admin | Learning Admin | Instructor |        Employee |
| -------------------- | ----------: | -------------: | ---------: | --------------: |
| Login                |         Yes |            Yes |        Yes |             Yes |
| User Management      |         Yes |        Limited |         No |              No |
| Course CRUD          |         Yes |            Yes |   Assigned |              No |
| Publish Course       |         Yes |            Yes |         No |              No |
| Module CRUD          |         Yes |            Yes |   Assigned |              No |
| Material CRUD        |         Yes |            Yes |   Assigned |              No |
| Enroll Course        |         Yes |            Yes |        Yes |             Yes |
| Complete Material    |         Yes |            Yes |        Yes |             Yes |
| Quiz Management      |         Yes |            Yes |   Assigned |              No |
| Take Quiz            |         Yes |            Yes |        Yes |             Yes |
| View Own Progress    |         Yes |            Yes |        Yes |             Yes |
| View Reports         |         Yes |            Yes |    Limited |        Own data |
| Generate Certificate |      System |         System |     System |       Automatic |
| View Certificate     |         Yes |            Yes |        Yes | Own certificate |

Authorization tetap harus divalidasi di backend menggunakan Policy/Middleware.

---

# 18. Critical Business Flows

## Employee Learning Flow

```text
Login
  ↓
Browse Published Courses
  ↓
Select Course
  ↓
Enroll
  ↓
Start Learning
  ↓
Complete Materials
  ↓
Take Quiz
  ↓
Pass Quiz
  ↓
Complete Course
  ↓
Receive Certificate
```

---

## Admin Course Flow

```text
Create Category
      ↓
Create Course
      ↓
Add Instructor
      ↓
Add Modules
      ↓
Add Materials
      ↓
Add Quiz
      ↓
Publish Course
```

---

## Quiz Flow

```text
Published Quiz
      ↓
Employee Start
      ↓
Create Attempt
      ↓
Answer Questions
      ↓
Submit
      ↓
Calculate Score
      ↓
Passed?
   ↙       ↘
 YES       NO
  ↓         ↓
Complete   Retry
Eligibility
```

---

# 19. Module Development Order

Module implementation dilakukan secara bertahap.

Recommended order:

```text
1. Authentication
        ↓
2. Users
        ↓
3. Courses
        ↓
4. Learning
        ↓
5. Assessments
        ↓
6. Certificates
        ↓
7. Reports
        ↓
8. Notifications
```

Alasan:

* Authentication diperlukan oleh module lain.
* Users diperlukan untuk role dan ownership.
* Courses menjadi sumber utama learning.
* Learning membutuhkan courses.
* Assessments bergantung pada learning/course.
* Certificates bergantung pada completion.
* Reports mengambil data dari module lain.
* Notifications bukan dependency MVP.

---

# 20. Module Definition of Done

Sebuah module dianggap selesai jika:

* Responsibility module jelas.
* Database sesuai `docs/database.md`.
* API contract terdokumentasi.
* Authentication diterapkan jika diperlukan.
* Authorization diterapkan.
* Validation tersedia.
* Business logic berada pada layer yang tepat.
* Critical business rules memiliki test.
* Error handling tersedia.
* Frontend terintegrasi jika module membutuhkan UI.
* Documentation diperbarui.
* Tidak ada circular dependency yang tidak diperlukan.

---

# 21. Architectural Principles

Development ELMS harus mengikuti prinsip:

### 1. Business-oriented modules

Module dibentuk berdasarkan business capability.

### 2. Low coupling

Module tidak boleh terlalu bergantung pada internal implementation module lain.

### 3. High cohesion

Kode yang memiliki responsibility sama ditempatkan dalam module yang sama.

### 4. Backend as security boundary

Frontend tidak dianggap sebagai security layer.

### 5. Thin controllers

Controller menangani HTTP concern, bukan business logic kompleks.

### 6. Explicit business rules

Business rule harus mudah ditemukan dan dipahami.

### 7. Avoid premature abstraction

Jangan menambahkan design pattern hanya karena terlihat lebih enterprise.

### 8. Documentation follows implementation

Perubahan architecture atau business rule harus tercermin pada dokumentasi.

---

# 22. Source of Truth

Module definition ini harus digunakan bersama:

```text
docs/requirements.md
docs/architecture.md
docs/database.md
docs/api.md
```

Jika terdapat konflik:

```text
Business requirement
        ↓
Architecture decision
        ↓
Database design
        ↓
Module implementation
```

Perubahan terhadap module boundary harus didokumentasikan terlebih dahulu sebelum melakukan refactoring besar.

---

# 23. AI Coding Agent Rules

AI coding agent seperti Antigravity harus mengikuti aturan berikut ketika mengimplementasikan module:

1. Baca `docs/requirements.md`.
2. Baca `docs/architecture.md`.
3. Baca `docs/database.md`.
4. Baca `docs/modules.md`.
5. Inspect existing repository sebelum mengubah kode.
6. Jangan membuat architecture baru yang bertentangan dengan dokumentasi.
7. Jangan membuat migration baru tanpa memastikan schema sesuai `database.md`.
8. Jangan menaruh business logic kompleks di Controller.
9. Jangan melewati Form Request untuk validation yang membutuhkan server-side validation.
10. Jangan melewati Policy/Middleware untuk authorization.
11. Jangan membuat Repository jika belum ada alasan yang jelas.
12. Jangan menambahkan dependency tanpa kebutuhan.
13. Jangan mengubah module lain jika tidak diperlukan.
14. Jalankan test setelah implementasi.
15. Periksa regression pada feature yang sudah ada.
16. Jelaskan file yang diubah dan alasan perubahan.
17. Update documentation jika implementation mengubah contract atau architecture.

---

# 24. Final Module Map

```text
ELMS
│
├── Authentication
│   └── Login / Logout / Session
│
├── Users
│   └── User / Role / Department
│
├── Courses
│   ├── Category
│   ├── Course
│   ├── Instructor
│   ├── Module
│   └── Material
│
├── Learning
│   ├── Enrollment
│   ├── Material Progress
│   └── Course Completion
│
├── Assessments
│   ├── Quiz
│   ├── Question
│   ├── Option
│   ├── Attempt
│   └── Answer
│
├── Certificates
│   └── Certificate
│
├── Reports
│   └── Dashboard / Statistics
│
└── Notifications
    └── Future Enhancement
```

Dokumen ini menjadi acuan pembagian responsibility module selama pengembangan ELMS.
