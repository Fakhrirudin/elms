# ELMS Requirements

## 1. Project Overview

**ELMS (Employee Learning Management System)** adalah aplikasi web Learning Management System (LMS) untuk mendukung proses pembelajaran internal karyawan.

Sistem memungkinkan employee untuk mengikuti course, mempelajari material, mengerjakan quiz, melihat progress, dan memperoleh certificate setelah memenuhi persyaratan penyelesaian course.

Untuk kebutuhan portfolio dan technical selection, ELMS dibuat sebagai **simulasi enterprise internal LMS**.

> ELMS bukan merupakan sistem resmi milik Kementerian Luar Negeri atau instansi pemerintah tertentu.

---

# 2. Project Objectives

Tujuan utama ELMS:

1. Menyediakan platform pembelajaran internal bagi employee.
2. Memudahkan admin dalam mengelola course dan learning material.
3. Memungkinkan instructor mengelola materi pembelajaran dan quiz.
4. Memungkinkan employee mengikuti course dan memantau progress.
5. Menyediakan assessment melalui quiz.
6. Menghasilkan certificate setelah employee memenuhi completion requirements.
7. Menyediakan dashboard dan learning statistics.
8. Mengimplementasikan fullstack application dengan React, Laravel, PostgreSQL, REST API, Git, dan Modular Monolith Architecture.

---

# 3. Target Users

ELMS memiliki empat role utama:

### 3.1 Super Admin

Memiliki akses penuh terhadap sistem.

Responsibilities:

* Mengelola user.
* Mengelola role.
* Mengelola department.
* Mengelola course.
* Mengelola category.
* Mengelola instructor.
* Melihat laporan.
* Mengakses seluruh data sistem.

---

### 3.2 Learning Admin

Bertanggung jawab terhadap operasional pembelajaran.

Responsibilities:

* Mengelola course.
* Mengelola module.
* Mengelola material.
* Mengelola instructor.
* Mengelola quiz.
* Melihat progress employee.
* Melihat laporan pembelajaran.

---

### 3.3 Instructor

Bertanggung jawab terhadap course yang ditugaskan kepadanya.

Responsibilities:

* Melihat course yang ditugaskan.
* Mengelola material course.
* Mengelola quiz.
* Melihat peserta course.
* Melihat hasil quiz.

Instructor hanya dapat mengelola course yang menjadi tanggung jawabnya.

---

### 3.4 Employee

Menggunakan sistem untuk mengikuti pembelajaran.

Responsibilities:

* Melihat course yang tersedia.
* Enroll course.
* Mengakses material.
* Menandai material selesai.
* Mengikuti quiz.
* Melihat progress.
* Melihat hasil quiz.
* Mengakses certificate.

---

# 4. MVP Scope

MVP ELMS terdiri dari:

```text
Authentication
User Management
Course Management
Module Management
Material Management
Enrollment
Learning Progress
Quiz / Assessment
Certificate
Dashboard
Reporting
```

---

# 5. Functional Requirements

## 5.1 Authentication

System harus menyediakan:

* Login.
* Logout.
* Current authenticated user.
* Password authentication.
* Authentication state.
* Protected API endpoints.

### Rules

* User harus memiliki email dan password yang valid.
* User inactive tidak dapat login.
* Password disimpan menggunakan secure hashing.
* Password tidak boleh dikembalikan melalui API.

---

# 6. User Management

Admin dapat:

* Melihat daftar user.
* Melihat detail user.
* Membuat user.
* Mengubah user.
* Mengaktifkan user.
* Menonaktifkan user.
* Mengatur role.
* Mengatur department.

### User Data

Minimal:

* Name
* Employee number
* Email
* Password
* Role
* Department
* Active status

### Rules

* Email harus unique.
* Employee number harus unique apabila diisi.
* User inactive tidak dapat login.
* Employee tidak dapat mengakses administrative functionality.

---

# 7. Course Management

Admin dapat:

* Membuat course.
* Melihat course.
* Mengubah course.
* Menghapus course.
* Mengubah status course.
* Menentukan category.
* Menentukan instructor.
* Mengatur thumbnail.
* Mengatur estimated duration.

### Course Status

```text
DRAFT
PUBLISHED
ARCHIVED
```

### Course Rules

* Course harus memiliki title.
* Course harus memiliki category.
* Course memiliki satu atau lebih module.
* Hanya course `PUBLISHED` yang dapat diikuti employee.
* Course `DRAFT` tidak muncul pada catalog employee.
* Course `ARCHIVED` tidak dapat menerima enrollment baru.

---

# 8. Category Management

Admin dapat:

* Membuat category.
* Melihat category.
* Mengubah category.
* Menghapus category jika tidak digunakan.

### Rules

* Category name harus unique.
* Category memiliki slug unique.

---

# 9. Instructor Management

Admin dapat menentukan instructor untuk sebuah course.

Satu course dapat memiliki satu atau lebih instructor.

Instructor dapat:

* Melihat course yang ditugaskan.
* Mengelola learning content sesuai authorization.
* Melihat peserta course.
* Melihat hasil assessment.

Instructor tidak dapat mengelola course yang tidak ditugaskan kepadanya.

---

# 10. Module Management

Setiap course terdiri dari beberapa module.

Admin/instructor yang memiliki permission dapat:

* Membuat module.
* Mengubah module.
* Menghapus module.
* Mengubah urutan module.

Contoh:

```text
Course: Web Development

Module 1 - Introduction
Module 2 - Frontend Development
Module 3 - Backend Development
Module 4 - Final Assessment
```

### Rules

* Module hanya dimiliki oleh satu course.
* Module memiliki `sort_order`.
* Urutan module dapat diubah.

---

# 11. Material Management

Setiap module dapat memiliki beberapa material.

Jenis material MVP:

```text
TEXT
PDF
VIDEO
```

Admin/instructor dapat:

* Membuat material.
* Mengubah material.
* Menghapus material.
* Mengubah urutan material.
* Upload PDF.
* Menentukan video URL.
* Menentukan apakah material mandatory.

### Rules

Material harus memiliki content yang sesuai dengan type.

Contoh:

```text
TEXT  → content
PDF   → file_path
VIDEO → video_url
```

Material dapat ditandai sebagai:

```text
MANDATORY
OPTIONAL
```

Default:

```text
MANDATORY
```

---

# 12. Course Enrollment

Employee dapat melakukan enrollment terhadap course.

### Flow

```text
Browse Course
     ↓
Select Course
     ↓
Enroll
     ↓
ENROLLED
```

### Rules

* Employee hanya dapat enroll course `PUBLISHED`.
* Employee tidak dapat duplicate enrollment pada course yang sama.
* Enrollment memiliki unique constraint berdasarkan:

```text
user_id + course_id
```

Initial status:

```text
ENROLLED
```

---

# 13. Learning Progress

System harus dapat menghitung progress employee.

Progress dihitung berdasarkan material mandatory yang telah diselesaikan.

Contoh:

```text
Total mandatory materials = 10
Completed materials = 6

Progress = 6 / 10 × 100
         = 60%
```

Progress tidak disimpan sebagai percentage permanen.

System menghitung progress berdasarkan data `material_progress`.

---

# 14. Material Completion

Employee dapat menandai material sebagai selesai.

Contoh:

```text
POST /materials/{material}/complete
```

Setelah material selesai:

```text
material_progress
```

dibuat atau diperbarui.

### Rules

* Material completion harus terkait dengan enrollment employee.
* Employee tidak dapat menandai material dari course yang tidak diikuti.
* Material dari course lain tidak boleh dianggap sebagai progress employee.
* Completion timestamp dicatat.

---

# 15. Enrollment Status

Enrollment memiliki status:

```text
ENROLLED
IN_PROGRESS
COMPLETED
```

### Status Flow

```text
ENROLLED
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

Status `IN_PROGRESS` dapat ditentukan ketika employee mulai menyelesaikan material.

Status `COMPLETED` hanya diberikan apabila completion requirements terpenuhi.

---

# 16. Quiz / Assessment

Course dapat memiliki quiz.

Quiz terdiri dari:

```text
Quiz
 └── Questions
      └── Options
```

MVP menggunakan multiple-choice question.

Setiap question memiliki satu correct option.

---

# 17. Quiz Management

Admin/instructor dapat:

* Membuat quiz.
* Mengubah quiz.
* Menghapus quiz.
* Membuat question.
* Mengubah question.
* Menghapus question.
* Membuat option.
* Menentukan correct option.
* Menentukan passing grade.
* Menentukan maximum attempts.

Quiz memiliki status:

```text
DRAFT
PUBLISHED
ARCHIVED
```

---

# 18. Quiz Attempt

Employee dapat:

1. Start quiz.
2. Menjawab question.
3. Submit quiz.
4. Melihat score.
5. Melihat status pass/fail.

Flow:

```text
Start
  ↓
Answer
  ↓
Submit
  ↓
Calculate Score
  ↓
PASS / FAIL
```

---

# 19. Quiz Rules

### Passing Grade

Default:

```text
70
```

Contoh:

```text
10 questions
8 correct

Score = 80

Passing grade = 70

Result = PASSED
```

### Maximum Attempts

Default:

```text
3 attempts
```

Employee tidak dapat melakukan attempt setelah jumlah maksimum tercapai.

### Attempt

Setiap attempt memiliki:

* Attempt number
* User
* Quiz
* Score
* Passed status
* Started timestamp
* Submitted timestamp

Attempt yang sudah submitted tidak dapat diubah.

---

# 20. Quiz Answer Rules

Ketika employee submit quiz:

System harus:

1. Memastikan attempt valid.
2. Memastikan attempt belum submitted.
3. Memastikan question valid.
4. Memastikan selected option berasal dari question yang sesuai.
5. Menghitung jawaban benar.
6. Menghitung score.
7. Menentukan pass/fail.
8. Menyimpan result.

Score harus dihitung oleh backend.

Frontend tidak boleh menentukan score akhir.

---

# 21. Course Completion

Course dianggap completed apabila employee telah memenuhi completion requirements.

### Requirement

```text
Mandatory materials = 100%
AND
Required quiz = PASSED
```

Jika course tidak memiliki required quiz:

```text
Mandatory materials = 100%
```

sudah cukup untuk menyelesaikan course.

---

# 22. Certificate

Employee mendapatkan certificate setelah menyelesaikan course.

### Requirements

```text
Course Progress = 100%
AND
Required Quiz = PASSED
```

Certificate memiliki:

* Certificate number
* Employee
* Course
* Issued date

Certificate number harus unique.

Satu enrollment hanya dapat memiliki satu certificate.

---

# 23. Dashboard

## Employee Dashboard

Menampilkan:

* Total enrolled courses.
* Courses in progress.
* Completed courses.
* Learning progress.
* Certificates.

---

## Admin Dashboard

Menampilkan:

* Total employees.
* Total courses.
* Published courses.
* Total enrollments.
* Completed courses.
* Average quiz score.

Dashboard harus mengambil data dari database secara dinamis.

---

# 24. Reporting

Admin dapat melihat:

* Course enrollment.
* Course completion.
* Employee progress.
* Quiz performance.
* Average quiz score.

Employee hanya dapat melihat data miliknya sendiri.

Instructor hanya dapat melihat data yang berkaitan dengan course yang ditugaskan.

---

# 25. Role-Based Access Control

Role MVP:

```text
SUPER_ADMIN
LEARNING_ADMIN
INSTRUCTOR
EMPLOYEE
```

### Access Summary

| Feature             | Super Admin | Learning Admin | Instructor | Employee |
| ------------------- | ----------: | -------------: | ---------: | -------: |
| User Management     |        Full |        Limited |         No |       No |
| Course Management   |        Full |           Full |   Assigned |       No |
| Module Management   |        Full |           Full |   Assigned |       No |
| Material Management |        Full |           Full |   Assigned |       No |
| Enrollment          |         Yes |            Yes |        Yes |      Yes |
| Learning            |         Yes |            Yes |        Yes |      Yes |
| Quiz Management     |        Full |           Full |   Assigned |       No |
| Take Quiz           |         Yes |            Yes |        Yes |      Yes |
| Certificate         |         Yes |            Yes |        Yes |      Own |
| Reports             |        Full |           Full |    Limited | Own data |

Authorization harus selalu divalidasi di backend.

---

# 26. REST API

Backend menyediakan REST API menggunakan prefix:

```text
/api/v1
```

API digunakan oleh React frontend.

Contoh:

```text
GET    /api/v1/courses
POST   /api/v1/courses
GET    /api/v1/courses/{id}
PUT    /api/v1/courses/{id}
DELETE /api/v1/courses/{id}
```

API harus:

* Menggunakan HTTP methods sesuai kebutuhan.
* Menggunakan HTTP status code yang sesuai.
* Mengembalikan response JSON.
* Memiliki validation.
* Memiliki authorization.
* Memiliki consistent response format.
* Mendukung pagination untuk collection besar.

Detail API contract akan didefinisikan pada:

```text
docs/api.md
```

---

# 27. Database Requirements

Database menggunakan:

```text
PostgreSQL
```

Entity utama:

```text
Roles
Departments
Users
Categories
Courses
Course Instructors
Modules
Materials
Enrollments
Material Progress
Quizzes
Questions
Options
Quiz Attempts
Quiz Answers
Certificates
```

Database specification lengkap berada pada:

```text
docs/database.md
```

---

# 28. Non-Functional Requirements

## 28.1 Performance

System harus:

* Menggunakan pagination untuk data collection.
* Menghindari unnecessary database queries.
* Menghindari N+1 query.
* Menggunakan eager loading jika diperlukan.
* Menggunakan indexing pada foreign key dan field yang sering digunakan untuk lookup.

---

## 28.2 Security

System harus:

* Menggunakan password hashing.
* Memvalidasi input.
* Menerapkan authentication.
* Menerapkan authorization.
* Mencegah SQL injection.
* Memvalidasi file upload.
* Menerapkan rate limiting pada endpoint sensitif.
* Tidak mengekspos informasi internal server.
* Tidak mengembalikan password atau token sensitif dalam response.

---

## 28.3 Maintainability

Code harus:

* Mengikuti Laravel convention jika tidak bertentangan dengan Modular Monolith.
* Menggunakan TypeScript pada frontend.
* Memisahkan business logic dari controller.
* Memiliki module boundary yang jelas.
* Menghindari duplicate logic.
* Memiliki dokumentasi untuk architecture dan API.

---

## 28.4 Scalability

MVP menggunakan Modular Monolith.

Architecture harus memungkinkan module berkembang tanpa langsung memerlukan microservices.

Microservices tidak menjadi requirement MVP.

---

## 28.5 Availability

Application harus menangani error secara graceful.

User tidak boleh mendapatkan:

* SQL error mentah.
* Stack trace production.
* Database credentials.
* Internal file path.

---

# 29. Error Handling Requirements

API harus menggunakan response yang konsisten.

Contoh:

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": [
            "The email field is required."
        ]
    }
}
```

HTTP status:

| Status | Meaning           |
| ------ | ----------------- |
| 200    | Success           |
| 201    | Created           |
| 204    | No Content        |
| 400    | Bad Request       |
| 401    | Unauthenticated   |
| 403    | Forbidden         |
| 404    | Not Found         |
| 422    | Validation Error  |
| 429    | Too Many Requests |
| 500    | Server Error      |

---

# 30. File Management

System mendukung upload:

* Course thumbnail.
* PDF learning material.

File binary tidak disimpan langsung di PostgreSQL.

PostgreSQL hanya menyimpan file path/metadata.

Laravel Filesystem digunakan untuk storage.

MVP menggunakan local storage.

Future implementation dapat menggunakan S3-compatible object storage.

---

# 31. Audit & Logging

MVP minimal menyediakan application logging untuk error dan exception.

Audit log dapat dikembangkan untuk mencatat:

* User login.
* Course changes.
* User changes.
* Quiz submission.
* Certificate generation.

Audit log bukan mandatory feature MVP.

---

# 32. Out of Scope

Feature berikut tidak termasuk MVP:

### Authentication

* SSO.
* LDAP integration.
* External identity provider.

### HR Integration

* HRIS integration.
* Employee synchronization.
* Organization synchronization.

### Learning

* Live classroom.
* Video conferencing.
* Live streaming.
* Advanced learning recommendation.
* AI tutor.

### Assessment

* Essay grading.
* Coding assessment.
* Complex question types.

### Communication

* WhatsApp integration.
* Email campaign system.
* Push notification.

### Platform

* Mobile application.
* Public marketplace.
* Payment system.
* Multi-tenant architecture.

### Advanced Analytics

* Advanced BI dashboard.
* Predictive analytics.
* AI-based learning recommendation.

---

# 33. MVP Success Criteria

ELMS MVP dianggap berhasil apabila employee dapat melakukan:

```text
Login
  ↓
Browse Course
  ↓
Enroll
  ↓
Access Material
  ↓
Complete Material
  ↓
Track Progress
  ↓
Take Quiz
  ↓
Pass Quiz
  ↓
Complete Course
  ↓
Receive Certificate
```

Dan admin dapat melakukan:

```text
Login
  ↓
Create Course
  ↓
Assign Instructor
  ↓
Create Modules
  ↓
Create Materials
  ↓
Create Quiz
  ↓
Publish Course
  ↓
Monitor Learning
```

---

# 34. Technical Requirements

Implementasi wajib menggunakan:

```text
Frontend
React.js
TypeScript

Backend
Laravel

Database
PostgreSQL

API
REST API

Version Control
Git
```

Architecture:

```text
Modular Monolith
```

Authentication:

```text
Laravel Sanctum
```

Frontend data fetching:

```text
TanStack Query
```

HTTP client:

```text
Axios
```

---

# 35. Development Constraints

Developer/AI coding agent harus:

1. Mengikuti requirements ini.
2. Mengikuti `docs/architecture.md`.
3. Mengikuti `docs/database.md`.
4. Mengikuti `docs/modules.md`.
5. Tidak menambahkan feature di luar scope tanpa alasan.
6. Tidak mengganti stack utama tanpa alasan teknis yang kuat.
7. Tidak membuat microservices untuk MVP.
8. Tidak menggunakan Next.js sebagai frontend utama ELMS.
9. Tidak membuat business logic kompleks di Controller.
10. Tidak mengandalkan frontend untuk security.
11. Tidak membuat database schema yang bertentangan dengan `database.md`.
12. Tidak menambahkan dependency hanya untuk kebutuhan yang sebenarnya dapat diselesaikan dengan existing stack.

---

# 36. Definition of Done

Feature dianggap selesai apabila:

* Functional requirement terpenuhi.
* Database sesuai specification.
* API tersedia.
* Validation tersedia.
* Authorization tersedia.
* Business logic berjalan.
* Frontend terintegrasi.
* Error handling tersedia.
* Critical business rule memiliki test.
* Tidak menyebabkan regression.
* Documentation diperbarui jika diperlukan.
* Git commit dibuat dengan message yang jelas.

---

# 37. Documentation Map

Dokumentasi ELMS:

```text
docs/
│
├── requirements.md
│   └── What the system must do
│
├── architecture.md
│   └── How the system is structured
│
├── database.md
│   └── Database schema
│
├── modules.md
│   └── Module responsibilities
│
├── api.md
│   └── REST API contract
│
└── development-guide.md
    └── Development workflow
```

Setiap dokumen memiliki responsibility masing-masing.

---

# 38. Source of Truth

Urutan source of truth:

```text
requirements.md
       ↓
architecture.md
       ↓
database.md
       ↓
modules.md
       ↓
api.md
       ↓
implementation
```

Jika implementation tidak sesuai dengan requirements, implementation harus diperbaiki atau requirement harus diperbarui dengan alasan yang jelas.

Dokumentasi dan implementation harus selalu dijaga tetap sinkron.

---

# 39. Final MVP Scope

### Included

```text
✓ Authentication
✓ RBAC
✓ User Management
✓ Department
✓ Category
✓ Course
✓ Instructor Assignment
✓ Module
✓ Material
✓ Enrollment
✓ Learning Progress
✓ Quiz
✓ Quiz Attempt
✓ Quiz Scoring
✓ Certificate
✓ Employee Dashboard
✓ Admin Dashboard
✓ Basic Reports
✓ REST API
✓ PostgreSQL
✓ React
✓ Laravel
✓ Git
✓ Modular Monolith
```

### Not Included

```text
✗ SSO
✗ HRIS Integration
✗ AI Tutor
✗ Live Class
✗ Video Conference
✗ Mobile App
✗ Payment
✗ Advanced Analytics
✗ Microservices
✗ Multi-tenant
```

---

## 40. Requirement Principle

ELMS harus dibangun sebagai aplikasi yang:

> **Simple enough for an MVP, but structured enough to demonstrate enterprise-level development practices.**

Prioritas utama:

1. Functional correctness
2. Security
3. Maintainability
4. Clean architecture
5. Testing
6. Performance
7. Scalability
