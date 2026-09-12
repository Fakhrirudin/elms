# AGENTS.md

## 1. Project Overview

Project ini adalah **ELMS (Employee Learning Management System)**, yaitu simulasi LMS internal untuk kebutuhan pembelajaran dan pengembangan kompetensi karyawan.

Project ini dibuat sebagai portfolio/prototype dan **bukan sistem resmi Kementerian Luar Negeri (Kemenlu)**.

Tujuan utama project adalah menunjukkan kemampuan Fullstack Development dengan:

* React.js
* TypeScript
* Laravel
* PostgreSQL
* REST API
* Modular Monolith Architecture
* Git
* Authentication & Authorization
* LMS business flow

---

## 2. Mandatory Documentation

**WAJIB membaca dan memahami dokumentasi berikut sebelum melakukan perubahan besar pada project:**

1. `docs/requirements.md`
2. `docs/architecture.md`
3. `docs/database.md`
4. `docs/modules.md`
5. `docs/api.md`

Dokumentasi tersebut merupakan **source of truth** project.

Jika implementasi existing berbeda dengan dokumentasi:

1. Jangan langsung melakukan refactor besar.
2. Identifikasi perbedaannya.
3. Jelaskan dampaknya.
4. Ajukan pendekatan yang paling aman.
5. Lakukan perubahan hanya setelah scope jelas.

Jika schema, API, atau architecture berubah, dokumentasi terkait juga harus diperbarui.

---

## 3. Current Technology Direction

Target architecture:

```text
React.js + TypeScript
        ↓
REST API
        ↓
Laravel Modular Monolith
        ↓
PostgreSQL
```

Technology utama:

* Frontend: React.js + TypeScript
* Backend: Laravel
* Database: PostgreSQL
* API: REST API
* Authentication: Laravel Sanctum
* Server state: TanStack Query
* HTTP client: Axios
* Styling: gunakan library/configuration yang sudah tersedia jika memungkinkan
* Version control: Git
* Development environment: Docker-compatible

### Important

Jangan menggunakan:

* Next.js sebagai frontend utama
* Microservices
* Redux hanya untuk memenuhi requirement
* Repository Pattern secara berlebihan
* Dependency tambahan tanpa alasan yang jelas

Project harus tetap menunjukkan **React.js murni sebagai frontend utama**.

---

## 4. Existing Repository

Project mungkin berasal dari Laravel starter/scaffold yang sudah memiliki:

* Laravel
* Inertia.js
* React
* TypeScript
* Fortify
* Tailwind

**Jangan berasumsi bahwa existing implementation sudah sesuai dengan target architecture.**

Sebelum melakukan perubahan:

* inspect repository
* inspect `composer.json`
* inspect `package.json`
* inspect routes
* inspect migrations
* inspect models
* inspect authentication
* inspect frontend structure
* inspect existing tests
* inspect configuration

Kemudian bandingkan dengan dokumentasi project.

Jangan melakukan rewrite besar hanya karena struktur existing berbeda.

---

## 5. Development Workflow

### RULE: Do Not Build Everything at Once

Jangan mengimplementasikan seluruh LMS dalam satu task.

Development harus dilakukan **module-by-module** dan **incrementally**.

Urutan yang disarankan:

```text
1. Repository Audit
2. Authentication
3. Users & Roles
4. Categories
5. Courses
6. Modules & Materials
7. Enrollment
8. Learning Progress
9. Quiz & Assessment
10. Certificates
11. Dashboard & Reports
12. Notifications
13. Testing & Refinement
```

Setiap module harus:

1. Memahami requirement.
2. Inspect existing implementation.
3. Menentukan perubahan.
4. Implement backend.
5. Implement API.
6. Implement frontend.
7. Implement validation & authorization.
8. Test.
9. Review.
10. Dokumentasikan perubahan.
11. Commit ke Git.

---

## 6. First Task: Repository Audit

Jika belum ada task spesifik dari user, **jangan langsung membuat feature**.

Task pertama harus berupa audit repository.

Audit minimal:

```text
- Laravel version
- PHP version
- Node.js version
- npm/package manager
- composer dependencies
- frontend dependencies
- current frontend architecture
- current backend architecture
- routes
- authentication
- migrations
- models
- database configuration
- tests
- existing components
- existing API support
- existing Inertia implementation
```

Bandingkan kondisi repository dengan:

```text
docs/requirements.md
docs/architecture.md
docs/database.md
docs/modules.md
docs/api.md
```

Output audit harus menjelaskan:

```text
Current State
Target State
Gap
Recommended Action
Potential Risk
```

Untuk audit-only task, **jangan mengubah file** kecuali user secara eksplisit meminta implementasi.

---

## 7. Backend Architecture

Backend menggunakan **Modular Monolith Architecture**.

Target structure:

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

Setiap module dapat memiliki:

```text
Controllers/
Requests/
Services/
Models/
Policies/
Routes/
```

### Layering

Gunakan pola:

```text
Request
   ↓
Form Request
   ↓
Controller
   ↓
Service
   ↓
Eloquent Model
   ↓
PostgreSQL
```

Controller harus tetap **thin**.

Jangan menaruh business logic kompleks di Controller.

Business logic utama harus berada di Service.

---

## 8. Repository Pattern

Repository Pattern **tidak wajib**.

Gunakan Repository hanya jika memang memberikan manfaat nyata, misalnya:

* query sangat kompleks
* sumber data lebih dari satu
* abstraction memang dibutuhkan
* testing membutuhkan isolation yang jelas

Untuk CRUD sederhana:

```text
Controller → Service → Eloquent
```

sudah cukup.

Jangan membuat:

```text
Controller → Service → Repository → Model
```

untuk semua fitur hanya agar terlihat "enterprise".

---

## 9. Validation

Gunakan Laravel Form Request untuk validation.

Contoh:

```text
StoreCourseRequest
UpdateCourseRequest
StoreMaterialRequest
SubmitQuizRequest
```

Jangan menaruh validasi kompleks langsung di Controller jika dapat menggunakan Form Request.

Validation harus mencakup:

* required fields
* format
* database existence
* uniqueness
* authorization-sensitive validation jika diperlukan
* business rules

---

## 10. Authorization & Security

Security harus ditegakkan di backend.

Jangan hanya menyembunyikan tombol frontend.

Gunakan:

* Sanctum
* Middleware
* Policies
* Form Requests
* Role-based authorization

Contoh:

Employee tidak boleh:

```text
- membuat course
- mengubah course
- menghapus material milik course
- melihat hasil quiz employee lain
- membuat certificate secara manual
```

Backend harus tetap menolak request meskipun endpoint dipanggil langsung.

### Security Rules

Jangan:

* hardcode password
* hardcode API key
* commit `.env`
* expose secret
* menggunakan user input secara tidak aman
* mengembalikan correct answer quiz sebelum submission
* mempercayai role dari frontend
* mempercayai ownership dari frontend

---

## 11. Database Rules

Database menggunakan PostgreSQL.

Schema harus mengikuti:

```text
docs/database.md
```

Sebelum membuat migration baru:

1. Check `docs/database.md`.
2. Check existing migrations.
3. Pastikan tidak membuat duplicate structure.
4. Pastikan foreign key dan relationship konsisten.
5. Update documentation jika schema berubah.

Gunakan:

* foreign keys
* indexes
* unique constraints
* appropriate nullable fields
* transactions untuk operasi kritis

Jangan melakukan destructive database operation tanpa alasan yang jelas.

**Jangan drop database atau reset seluruh database tanpa instruksi eksplisit dari user.**

---

## 12. Business Rules

Business rules adalah bagian penting dari project.

Implementasi harus mengikuti aturan seperti:

### Course

Employee hanya dapat enrollment ke course:

```text
status = PUBLISHED
```

### Enrollment

Satu employee hanya boleh memiliki satu enrollment aktif untuk course yang sama.

Gunakan database constraint:

```text
unique(user_id, course_id)
```

### Progress

Progress dihitung berdasarkan material wajib yang telah selesai.

Contoh:

```text
6 / 10 mandatory materials = 60%
```

Jangan menyimpan percentage jika dapat dihitung dari source data.

### Course Completion

Course tidak boleh COMPLETED sebelum seluruh mandatory material selesai.

### Quiz

Flow:

```text
Start Attempt
    ↓
Answer Questions
    ↓
Submit
    ↓
Calculate Score
    ↓
Pass / Fail
```

Submission harus aman dari race condition dan menggunakan transaction jika diperlukan.

### Certificate

Certificate hanya boleh diterbitkan apabila:

```text
100% mandatory material completed
AND
required quiz passed
```

Jangan memberikan certificate hanya karena frontend mengatakan progress sudah 100%.

---

## 13. API Rules

Semua API menggunakan:

```text
/api/v1/
```

API harus mengikuti REST convention.

Contoh:

```text
GET    /api/v1/courses
POST   /api/v1/courses
GET    /api/v1/courses/{course}
PUT    /api/v1/courses/{course}
DELETE /api/v1/courses/{course}
```

Gunakan HTTP status code yang sesuai.

Validation error harus konsisten.

Response structure harus mengikuti:

```text
docs/api.md
```

Jangan membuat endpoint baru tanpa mempertimbangkan API documentation.

---

## 14. Frontend Architecture

Frontend menggunakan React + TypeScript.

Target structure:

```text
resources/js/
├── features/
│   ├── auth/
│   ├── courses/
│   ├── learning/
│   ├── assessments/
│   ├── certificates/
│   └── reports/
│
├── components/
├── services/
├── hooks/
├── routes/
└── types/
```

Gunakan feature-based organization untuk domain utama.

### State Management

Gunakan:

* TanStack Query → server state
* `useState` → local UI state
* Context → hanya jika benar-benar diperlukan

Jangan menggunakan Redux hanya untuk membuat project terlihat kompleks.

---

## 15. API Integration

Frontend harus berkomunikasi dengan backend melalui REST API.

Gunakan Axios atau HTTP client yang sudah tersedia.

Jangan:

* mengakses database langsung dari frontend
* memasukkan business logic backend ke frontend
* membuat duplicate API logic di banyak component

API interaction sebaiknya dipusatkan melalui:

```text
services/
hooks/
TanStack Query
```

---

## 16. File Upload

Untuk material PDF/video/thumbnail:

Database menyimpan:

```text
file_path
```

File binary dikelola oleh Laravel Filesystem.

Jangan menyimpan binary file langsung ke database.

MVP dapat menggunakan local storage.

Architecture harus memungkinkan migrasi ke:

```text
S3-compatible storage
```

di masa depan.

---

## 17. Testing

Critical business logic harus memiliki test.

Minimal test untuk:

### Authentication

* login success
* invalid credentials
* logout
* unauthorized access

### Authorization

* admin access
* employee restriction
* instructor restriction

### Courses

* create
* update
* publish
* enrollment restriction

### Enrollment

* successful enrollment
* duplicate enrollment rejected

### Progress

* material completion
* progress calculation
* course completion

### Quiz

* start attempt
* submit answer
* score calculation
* pass/fail
* max attempts

### Certificate

* certificate cannot be issued before requirements
* certificate issued after requirements satisfied

Prioritaskan test terhadap **business rules**, bukan hanya coverage angka.

---

## 18. Seeders & Development Data

Gunakan Factory dan Seeder untuk development data.

Seeder dapat menyediakan:

```text
Roles
Departments
Users
Categories
Courses
Modules
Materials
Quiz
Questions
Options
```

Development credentials harus jelas dan hanya digunakan untuk local development.

Jangan menggunakan data pribadi atau data organisasi nyata.

---

## 19. Dependencies

Sebelum menambahkan package baru:

1. Periksa apakah functionality sudah tersedia.
2. Periksa dependency existing.
3. Pastikan package benar-benar diperlukan.
4. Jelaskan alasan penambahan jika signifikan.

Jangan menambahkan library hanya untuk hal sederhana yang dapat dilakukan dengan existing stack.

---

## 20. Git Workflow

Gunakan Git secara incremental.

Commit harus memiliki tujuan yang jelas.

Contoh:

```text
feat(auth): implement login API
feat(courses): add course management
feat(learning): add material progress
feat(quiz): implement quiz submission
test(courses): add course authorization tests
fix(progress): correct mandatory material calculation
docs(api): update enrollment endpoints
```

Hindari commit seperti:

```text
update
fix
changes
final
final2
test
```

Jangan melakukan destructive Git operation seperti:

```text
git reset --hard
git clean -fd
```

tanpa instruksi eksplisit dari user.

---

## 21. Documentation Synchronization

Jika implementasi mengubah:

### Database

Update:

```text
docs/database.md
```

### Architecture

Update:

```text
docs/architecture.md
```

### Module responsibility

Update:

```text
docs/modules.md
```

### API

Update:

```text
docs/api.md
```

### Requirement/scope

Update:

```text
docs/requirements.md
```

Dokumentasi dan implementation tidak boleh sengaja dibiarkan berbeda.

---

## 22. AI Coding Agent Rules

Antigravity harus bekerja seperti software engineer, bukan sekadar code generator.

Sebelum coding:

```text
1. Understand the requirement.
2. Read relevant documentation.
3. Inspect existing implementation.
4. Identify dependencies.
5. Plan the smallest reasonable change.
```

Saat coding:

```text
1. Follow project architecture.
2. Keep changes focused.
3. Avoid unnecessary refactoring.
4. Preserve working functionality.
5. Add validation.
6. Add authorization.
7. Add tests for critical behavior.
```

Setelah coding:

```text
1. Run relevant tests.
2. Run lint/type checks where applicable.
3. Inspect changed files.
4. Check for accidental changes.
5. Explain what changed.
6. Explain tests performed.
7. Mention known risks.
8. Suggest next logical step.
```

---

## 23. Stop Conditions

Antigravity harus berhenti dan meminta clarification sebelum melakukan perubahan besar jika:

* requirement bertentangan dengan architecture
* schema perlu perubahan besar
* existing authentication harus diganti total
* dependency besar perlu ditambahkan
* destructive database migration diperlukan
* module boundaries tidak jelas
* existing code memiliki behavior yang tidak terdokumentasi dan berisiko rusak
* perubahan berpotensi memengaruhi banyak module

Jangan menebak untuk perubahan architectural yang besar.

---

## 24. Avoid Overengineering

Project ini harus terlihat **professional dan maintainable**, bukan sengaja dibuat serumit mungkin.

Hindari:

* unnecessary abstractions
* unnecessary interfaces
* unnecessary repositories
* unnecessary design patterns
* excessive generic components
* microservices
* excessive state management
* duplicate business logic
* premature optimization

Prioritaskan:

```text
Correctness
Maintainability
Security
Readability
Testability
Clear Architecture
```

---

## 25. Definition of Done

Sebuah feature dianggap selesai jika:

* requirement sudah terpenuhi
* backend implementation selesai
* API tersedia jika diperlukan
* frontend terintegrasi
* validation tersedia
* authorization tersedia
* database sesuai
* critical business rules tested
* tidak merusak existing feature
* documentation sudah sesuai
* code dapat dipahami developer lain
* Git change dapat dijelaskan

---

## 26. Important Project Principle

Selalu prioritaskan:

> **Build a realistic, maintainable enterprise-style LMS — not a collection of demo CRUD pages.**

Setiap feature harus memiliki alasan bisnis yang jelas dan mengikuti architecture yang telah ditentukan.

Jika terdapat pilihan antara solusi yang lebih kompleks dan solusi yang lebih sederhana tetapi tetap memenuhi requirement, pilih solusi yang lebih sederhana.

**Correctness over complexity.**
