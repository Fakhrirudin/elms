# ELMS Database Design

## 1. Overview

Dokumen ini mendefinisikan rancangan database untuk **ELMS (Employee Learning Management System)**.

ELMS merupakan platform internal pembelajaran karyawan yang digunakan untuk mengelola:

* User dan role
* Department
* Course dan category
* Module dan material pembelajaran
* Enrollment
* Progress pembelajaran
* Quiz dan assessment
* Quiz attempts dan answers
* Certificate

Database menggunakan **PostgreSQL**.

Database design ini menjadi acuan sebelum pembuatan migration, model, relationship, service, dan API.

---

## 2. Database Technology

| Item          | Technology        |
| ------------- | ----------------- |
| Database      | PostgreSQL        |
| Primary Key   | BIGINT            |
| Foreign Key   | BIGINT            |
| Timestamp     | TIMESTAMP         |
| ORM           | Laravel Eloquent  |
| Migration     | Laravel Migration |
| Database Name | `elms_porto`      |

### General conventions

* Semua primary key menggunakan auto-increment `BIGINT`.
* Semua foreign key menggunakan `BIGINT`.
* Semua tabel utama menggunakan `created_at` dan `updated_at`.
* Foreign key harus memiliki index.
* Gunakan `snake_case` untuk nama tabel dan kolom.
* Nama tabel menggunakan bentuk plural.
* Gunakan foreign key constraint untuk menjaga referential integrity.
* Gunakan unique constraint untuk data yang tidak boleh duplikat.
* Gunakan enum/string yang konsisten untuk status.
* Jangan menyimpan data turunan jika dapat dihitung dari data sumber.

---

# 3. Entity Overview

Database MVP terdiri dari tabel:

1. `roles`
2. `departments`
3. `users`
4. `categories`
5. `courses`
6. `course_instructors`
7. `modules`
8. `materials`
9. `enrollments`
10. `material_progress`
11. `quizzes`
12. `questions`
13. `options`
14. `quiz_attempts`
15. `quiz_answers`
16. `certificates`

---

# 4. Entity Relationships

High-level relationships:

```text
roles
  │
  └──< users

departments
  │
  ├──< users
  └──< departments

categories
  │
  └──< courses

users
  │
  ├──< course_instructors >── courses
  └──< enrollments >────────── courses

courses
  │
  └──< modules
          │
          ├──< materials
          │
          └──< quizzes
                  │
                  └──< questions
                          │
                          └──< options

enrollments
  │
  ├──< material_progress >── materials
  └──< certificates

quiz_attempts
  │
  └──< quiz_answers
             │
             ├── questions
             └── options
```

---

# 5. Table Definitions

## 5.1 `roles`

Menyimpan role/akses pengguna.

### Columns

| Column        | Type         | Null | Default        | Description        |
| ------------- | ------------ | ---: | -------------- | ------------------ |
| `id`          | BIGINT       |   No | Auto Increment | Primary key        |
| `name`        | VARCHAR(50)  |   No | -              | Role name          |
| `description` | VARCHAR(255) |  Yes | NULL           | Role description   |
| `created_at`  | TIMESTAMP    |  Yes | NULL           | Creation timestamp |
| `updated_at`  | TIMESTAMP    |  Yes | NULL           | Update timestamp   |

### Constraints

```text
PRIMARY KEY (id)
UNIQUE (name)
```

### Initial roles

```text
Super Admin
Learning Admin
Instructor
Employee
```

---

# 5.2 `departments`

Menyimpan struktur organisasi/departemen.

Department dapat memiliki parent department untuk mendukung struktur organisasi bertingkat.

### Columns

| Column        | Type         | Null | Default        | Description            |
| ------------- | ------------ | ---: | -------------- | ---------------------- |
| `id`          | BIGINT       |   No | Auto Increment | Primary key            |
| `parent_id`   | BIGINT       |  Yes | NULL           | Parent department      |
| `name`        | VARCHAR(150) |   No | -              | Department name        |
| `description` | TEXT         |  Yes | NULL           | Department description |
| `created_at`  | TIMESTAMP    |  Yes | NULL           | Creation timestamp     |
| `updated_at`  | TIMESTAMP    |  Yes | NULL           | Update timestamp       |

### Constraints

```text
PRIMARY KEY (id)
FOREIGN KEY (parent_id) REFERENCES departments(id)
```

### Indexes

```text
INDEX (parent_id)
```

### Relationship

```text
departments 1 ──── * departments
departments 1 ──── * users
```

---

# 5.3 `users`

Menyimpan akun pengguna ELMS.

### Columns

| Column              | Type         | Null | Default        | Description                  |
| ------------------- | ------------ | ---: | -------------- | ---------------------------- |
| `id`                | BIGINT       |   No | Auto Increment | Primary key                  |
| `role_id`           | BIGINT       |   No | -              | User role                    |
| `department_id`     | BIGINT       |  Yes | NULL           | User department              |
| `name`              | VARCHAR(150) |   No | -              | Full name                    |
| `employee_number`   | VARCHAR(50)  |  Yes | NULL           | Employee identifier          |
| `email`             | VARCHAR(255) |   No | -              | Login email                  |
| `password`          | VARCHAR(255) |   No | -              | Hashed password              |
| `is_active`         | BOOLEAN      |   No | TRUE           | Account status               |
| `email_verified_at` | TIMESTAMP    |  Yes | NULL           | Email verification timestamp |
| `remember_token`    | VARCHAR(100) |  Yes | NULL           | Laravel remember token       |
| `created_at`        | TIMESTAMP    |  Yes | NULL           | Creation timestamp           |
| `updated_at`        | TIMESTAMP    |  Yes | NULL           | Update timestamp             |

### Constraints

```text
PRIMARY KEY (id)
FOREIGN KEY (role_id) REFERENCES roles(id)
FOREIGN KEY (department_id) REFERENCES departments(id)
UNIQUE (email)
UNIQUE (employee_number)
```

`employee_number` may be nullable, but when provided it must be unique.

### Indexes

```text
INDEX (role_id)
INDEX (department_id)
INDEX (is_active)
```

### Relationship

```text
roles 1 ──── * users
departments 1 ──── * users
```

---

# 5.4 `categories`

Menyimpan kategori course.

### Columns

| Column        | Type         | Null | Default        | Description             |
| ------------- | ------------ | ---: | -------------- | ----------------------- |
| `id`          | BIGINT       |   No | Auto Increment | Primary key             |
| `name`        | VARCHAR(100) |   No | -              | Category name           |
| `slug`        | VARCHAR(120) |   No | -              | URL-friendly identifier |
| `description` | TEXT         |  Yes | NULL           | Category description    |
| `created_at`  | TIMESTAMP    |  Yes | NULL           | Creation timestamp      |
| `updated_at`  | TIMESTAMP    |  Yes | NULL           | Update timestamp        |

### Constraints

```text
PRIMARY KEY (id)
UNIQUE (name)
UNIQUE (slug)
```

---

# 5.5 `courses`

Menyimpan informasi course.

### Columns

| Column               | Type         | Null | Default        | Description                   |
| -------------------- | ------------ | ---: | -------------- | ----------------------------- |
| `id`                 | BIGINT       |   No | Auto Increment | Primary key                   |
| `category_id`        | BIGINT       |   No | -              | Course category               |
| `title`              | VARCHAR(200) |   No | -              | Course title                  |
| `slug`               | VARCHAR(220) |   No | -              | URL-friendly identifier       |
| `description`        | TEXT         |  Yes | NULL           | Course description            |
| `thumbnail`          | VARCHAR(255) |  Yes | NULL           | Thumbnail path                |
| `estimated_duration` | INTEGER      |  Yes | NULL           | Estimated duration in minutes |
| `status`             | VARCHAR(20)  |   No | `DRAFT`        | Course status                 |
| `published_at`       | TIMESTAMP    |  Yes | NULL           | Publication timestamp         |
| `created_at`         | TIMESTAMP    |  Yes | NULL           | Creation timestamp            |
| `updated_at`         | TIMESTAMP    |  Yes | NULL           | Update timestamp              |

### Constraints

```text
PRIMARY KEY (id)
FOREIGN KEY (category_id) REFERENCES categories(id)
UNIQUE (slug)
```

### Indexes

```text
INDEX (category_id)
INDEX (status)
INDEX (published_at)
```

### Status

Allowed values:

```text
DRAFT
PUBLISHED
ARCHIVED
```

### Business rules

* Course dengan status `DRAFT` tidak dapat di-enroll oleh Employee.
* Course dengan status `PUBLISHED` dapat di-enroll.
* Course `ARCHIVED` tidak dapat menerima enrollment baru.
* `published_at` diisi ketika course dipublish.

---

# 5.6 `course_instructors`

Pivot table untuk relasi many-to-many antara course dan instructor.

Satu course dapat memiliki beberapa instructor dan satu instructor dapat mengajar beberapa course.

### Columns

| Column      | Type   | Null | Description |
| ----------- | ------ | ---: | ----------- |
| `course_id` | BIGINT |   No | Course      |
| `user_id`   | BIGINT |   No | Instructor  |

### Constraints

```text
PRIMARY KEY (course_id, user_id)

FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE

FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE
```

### Indexes

```text
INDEX (user_id)
```

---

# 5.7 `modules`

Menyimpan module dalam sebuah course.

Satu course memiliki satu atau lebih module.

### Columns

| Column        | Type         | Null | Default        | Description        |
| ------------- | ------------ | ---: | -------------- | ------------------ |
| `id`          | BIGINT       |   No | Auto Increment | Primary key        |
| `course_id`   | BIGINT       |   No | -              | Parent course      |
| `title`       | VARCHAR(200) |   No | -              | Module title       |
| `description` | TEXT         |  Yes | NULL           | Module description |
| `sort_order`  | INTEGER      |   No | 0              | Module ordering    |
| `created_at`  | TIMESTAMP    |  Yes | NULL           | Creation timestamp |
| `updated_at`  | TIMESTAMP    |  Yes | NULL           | Update timestamp   |

### Constraints

```text
PRIMARY KEY (id)
FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE
```

### Indexes

```text
INDEX (course_id)
INDEX (course_id, sort_order)
```

---

# 5.8 `materials`

Menyimpan material pembelajaran.

### Columns

| Column         | Type         | Null | Default        | Description            |
| -------------- | ------------ | ---: | -------------- | ---------------------- |
| `id`           | BIGINT       |   No | Auto Increment | Primary key            |
| `module_id`    | BIGINT       |   No | -              | Parent module          |
| `title`        | VARCHAR(200) |   No | -              | Material title         |
| `type`         | VARCHAR(20)  |   No | -              | Material type          |
| `content`      | TEXT         |  Yes | NULL           | Text content           |
| `file_path`    | VARCHAR(255) |  Yes | NULL           | Uploaded file path     |
| `video_url`    | VARCHAR(500) |  Yes | NULL           | External video URL     |
| `sort_order`   | INTEGER      |   No | 0              | Material ordering      |
| `is_mandatory` | BOOLEAN      |   No | TRUE           | Completion requirement |
| `created_at`   | TIMESTAMP    |  Yes | NULL           | Creation timestamp     |
| `updated_at`   | TIMESTAMP    |  Yes | NULL           | Update timestamp       |

### Constraints

```text
PRIMARY KEY (id)
FOREIGN KEY (module_id)
REFERENCES modules(id)
ON DELETE CASCADE
```

### Indexes

```text
INDEX (module_id)
INDEX (module_id, sort_order)
```

### Material types

```text
TEXT
PDF
VIDEO
```

### Business rules

* `TEXT` menggunakan `content`.
* `PDF` menggunakan `file_path`.
* `VIDEO` menggunakan `video_url`.
* Hanya field yang relevan dengan `type` yang boleh digunakan.
* Material mandatory harus diselesaikan untuk mencapai 100% course progress.

---

# 5.9 `enrollments`

Menyimpan enrollment Employee terhadap course.

### Columns

| Column         | Type        | Null | Default           | Description        |
| -------------- | ----------- | ---: | ----------------- | ------------------ |
| `id`           | BIGINT      |   No | Auto Increment    | Primary key        |
| `user_id`      | BIGINT      |   No | -                 | Employee           |
| `course_id`    | BIGINT      |   No | -                 | Course             |
| `status`       | VARCHAR(20) |   No | `ENROLLED`        | Enrollment status  |
| `enrolled_at`  | TIMESTAMP   |   No | Current timestamp | Enrollment time    |
| `completed_at` | TIMESTAMP   |  Yes | NULL              | Completion time    |
| `created_at`   | TIMESTAMP   |  Yes | NULL              | Creation timestamp |
| `updated_at`   | TIMESTAMP   |  Yes | NULL              | Update timestamp   |

### Constraints

```text
PRIMARY KEY (id)

FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE

FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE

UNIQUE (user_id, course_id)
```

### Indexes

```text
INDEX (user_id)
INDEX (course_id)
INDEX (status)
```

### Status

```text
ENROLLED
IN_PROGRESS
COMPLETED
```

### Business rules

* Employee hanya dapat memiliki satu enrollment aktif untuk satu course.
* Course harus `PUBLISHED` ketika enrollment dibuat.
* Status berubah menjadi `IN_PROGRESS` ketika Employee mulai menyelesaikan material.
* Status berubah menjadi `COMPLETED` ketika seluruh mandatory material selesai dan persyaratan quiz terpenuhi.

---

# 5.10 `material_progress`

Menyimpan progress penyelesaian material berdasarkan enrollment.

### Columns

| Column          | Type      | Null | Default           | Description          |
| --------------- | --------- | ---: | ----------------- | -------------------- |
| `id`            | BIGINT    |   No | Auto Increment    | Primary key          |
| `enrollment_id` | BIGINT    |   No | -                 | Enrollment           |
| `material_id`   | BIGINT    |   No | -                 | Completed material   |
| `completed_at`  | TIMESTAMP |   No | Current timestamp | Completion timestamp |
| `created_at`    | TIMESTAMP |  Yes | NULL              | Creation timestamp   |
| `updated_at`    | TIMESTAMP |  Yes | NULL              | Update timestamp     |

### Constraints

```text
PRIMARY KEY (id)

FOREIGN KEY (enrollment_id)
REFERENCES enrollments(id)
ON DELETE CASCADE

FOREIGN KEY (material_id)
REFERENCES materials(id)
ON DELETE CASCADE

UNIQUE (enrollment_id, material_id)
```

### Indexes

```text
INDEX (enrollment_id)
INDEX (material_id)
```

### Progress calculation

Progress tidak disimpan sebagai percentage.

Contoh:

```text
Completed mandatory materials = 6
Total mandatory materials = 10

Progress = 6 / 10 * 100
         = 60%
```

---

# 5.11 `quizzes`

Menyimpan quiz yang terkait dengan module.

### Columns

| Column               | Type         | Null | Default        | Description           |
| -------------------- | ------------ | ---: | -------------- | --------------------- |
| `id`                 | BIGINT       |   No | Auto Increment | Primary key           |
| `module_id`          | BIGINT       |   No | -              | Parent module         |
| `title`              | VARCHAR(200) |   No | -              | Quiz title            |
| `description`        | TEXT         |  Yes | NULL           | Quiz description      |
| `passing_grade`      | NUMERIC(5,2) |   No | 70             | Minimum passing score |
| `max_attempts`       | INTEGER      |   No | 3              | Maximum attempts      |
| `time_limit_minutes` | INTEGER      |  Yes | NULL           | Time limit            |
| `status`             | VARCHAR(20)  |   No | `DRAFT`        | Quiz status           |
| `created_at`         | TIMESTAMP    |  Yes | NULL           | Creation timestamp    |
| `updated_at`         | TIMESTAMP    |  Yes | NULL           | Update timestamp      |

### Constraints

```text
PRIMARY KEY (id)

FOREIGN KEY (module_id)
REFERENCES modules(id)
ON DELETE CASCADE
```

### Indexes

```text
INDEX (module_id)
INDEX (status)
```

### Status

```text
DRAFT
PUBLISHED
ARCHIVED
```

### Business rules

* Quiz harus `PUBLISHED` agar dapat dikerjakan Employee.
* `passing_grade` berada pada range 0–100.
* `max_attempts` minimal 1.
* `time_limit_minutes` jika NULL berarti tidak ada batas waktu.

---

# 5.12 `questions`

Menyimpan pertanyaan dalam quiz.

### Columns

| Column       | Type      | Null | Default        | Description        |
| ------------ | --------- | ---: | -------------- | ------------------ |
| `id`         | BIGINT    |   No | Auto Increment | Primary key        |
| `quiz_id`    | BIGINT    |   No | -              | Parent quiz        |
| `question`   | TEXT      |   No | -              | Question text      |
| `sort_order` | INTEGER   |   No | 0              | Question ordering  |
| `created_at` | TIMESTAMP |  Yes | NULL           | Creation timestamp |
| `updated_at` | TIMESTAMP |  Yes | NULL           | Update timestamp   |

### Constraints

```text
PRIMARY KEY (id)

FOREIGN KEY (quiz_id)
REFERENCES quizzes(id)
ON DELETE CASCADE
```

### Indexes

```text
INDEX (quiz_id)
INDEX (quiz_id, sort_order)
```

---

# 5.13 `options`

Menyimpan pilihan jawaban untuk question.

### Columns

| Column        | Type      | Null | Default        | Description         |
| ------------- | --------- | ---: | -------------- | ------------------- |
| `id`          | BIGINT    |   No | Auto Increment | Primary key         |
| `question_id` | BIGINT    |   No | -              | Parent question     |
| `option_text` | TEXT      |   No | -              | Answer option       |
| `is_correct`  | BOOLEAN   |   No | FALSE          | Correct answer flag |
| `sort_order`  | INTEGER   |   No | 0              | Option ordering     |
| `created_at`  | TIMESTAMP |  Yes | NULL           | Creation timestamp  |
| `updated_at`  | TIMESTAMP |  Yes | NULL           | Update timestamp    |

### Constraints

```text
PRIMARY KEY (id)

FOREIGN KEY (question_id)
REFERENCES questions(id)
ON DELETE CASCADE
```

### Indexes

```text
INDEX (question_id)
```

### Business rule

Untuk MVP, setiap question harus memiliki tepat satu correct option.

Validasi dilakukan pada application/service layer.

---

# 5.14 `quiz_attempts`

Menyimpan setiap percobaan Employee mengerjakan quiz.

### Columns

| Column           | Type         | Null | Default           | Description        |
| ---------------- | ------------ | ---: | ----------------- | ------------------ |
| `id`             | BIGINT       |   No | Auto Increment    | Primary key        |
| `quiz_id`        | BIGINT       |   No | -                 | Quiz               |
| `user_id`        | BIGINT       |   No | -                 | Employee           |
| `attempt_number` | INTEGER      |   No | -                 | Attempt sequence   |
| `score`          | NUMERIC(5,2) |  Yes | NULL              | Quiz score         |
| `passed`         | BOOLEAN      |  Yes | NULL              | Pass/fail          |
| `started_at`     | TIMESTAMP    |   No | Current timestamp | Start time         |
| `submitted_at`   | TIMESTAMP    |  Yes | NULL              | Submission time    |
| `created_at`     | TIMESTAMP    |  Yes | NULL              | Creation timestamp |
| `updated_at`     | TIMESTAMP    |  Yes | NULL              | Update timestamp   |

### Constraints

```text
PRIMARY KEY (id)

FOREIGN KEY (quiz_id)
REFERENCES quizzes(id)
ON DELETE CASCADE

FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE

UNIQUE (quiz_id, user_id, attempt_number)
```

### Indexes

```text
INDEX (quiz_id)
INDEX (user_id)
INDEX (quiz_id, user_id)
```

### Business rules

* `attempt_number` dimulai dari 1.
* Employee tidak boleh membuat attempt baru jika jumlah attempt telah mencapai `max_attempts`.
* `score` dihitung ketika quiz disubmit.
* `passed = true` jika `score >= passing_grade`.
* Attempt yang sudah submitted tidak dapat diubah jawabannya.

---

# 5.15 `quiz_answers`

Menyimpan jawaban Employee pada setiap question dalam sebuah attempt.

### Columns

| Column        | Type      | Null | Default        | Description        |
| ------------- | --------- | ---: | -------------- | ------------------ |
| `id`          | BIGINT    |   No | Auto Increment | Primary key        |
| `attempt_id`  | BIGINT    |   No | -              | Quiz attempt       |
| `question_id` | BIGINT    |   No | -              | Question           |
| `option_id`   | BIGINT    |   No | -              | Selected option    |
| `created_at`  | TIMESTAMP |  Yes | NULL           | Creation timestamp |
| `updated_at`  | TIMESTAMP |  Yes | NULL           | Update timestamp   |

### Constraints

```text
PRIMARY KEY (id)

FOREIGN KEY (attempt_id)
REFERENCES quiz_attempts(id)
ON DELETE CASCADE

FOREIGN KEY (question_id)
REFERENCES questions(id)
ON DELETE CASCADE

FOREIGN KEY (option_id)
REFERENCES options(id)
ON DELETE CASCADE

UNIQUE (attempt_id, question_id)
```

### Indexes

```text
INDEX (attempt_id)
INDEX (question_id)
INDEX (option_id)
```

### Business rules

* Satu question hanya memiliki satu jawaban dalam satu attempt.
* `option_id` harus berasal dari question yang sama dengan `question_id`.
* Jawaban tidak dapat diubah setelah attempt disubmit.

---

# 5.16 `certificates`

Menyimpan certificate yang diterbitkan setelah Employee menyelesaikan course.

### Columns

| Column               | Type         | Null | Default           | Description            |
| -------------------- | ------------ | ---: | ----------------- | ---------------------- |
| `id`                 | BIGINT       |   No | Auto Increment    | Primary key            |
| `enrollment_id`      | BIGINT       |   No | -                 | Related enrollment     |
| `certificate_number` | VARCHAR(100) |   No | -                 | Certificate identifier |
| `issued_at`          | TIMESTAMP    |   No | Current timestamp | Issued timestamp       |
| `created_at`         | TIMESTAMP    |  Yes | NULL              | Creation timestamp     |
| `updated_at`         | TIMESTAMP    |  Yes | NULL              | Update timestamp       |

### Constraints

```text
PRIMARY KEY (id)

FOREIGN KEY (enrollment_id)
REFERENCES enrollments(id)
ON DELETE CASCADE

UNIQUE (enrollment_id)
UNIQUE (certificate_number)
```

### Indexes

```text
INDEX (enrollment_id)
INDEX (certificate_number)
```

### Business rules

Certificate hanya dapat dibuat jika:

```text
Course progress = 100%
AND
Required quiz passed
```

Satu enrollment hanya menghasilkan satu certificate.

---

# 6. Referential Integrity

Foreign key behavior:

| Relationship                   | Delete behavior |
| ------------------------------ | --------------- |
| Role → User                    | RESTRICT        |
| Department → User              | RESTRICT        |
| Department → Department        | SET NULL        |
| Category → Course              | RESTRICT        |
| Course → Module                | CASCADE         |
| Course → Instructor            | CASCADE         |
| Module → Material              | CASCADE         |
| Module → Quiz                  | CASCADE         |
| User → Enrollment              | CASCADE         |
| Course → Enrollment            | CASCADE         |
| Enrollment → Material Progress | CASCADE         |
| Quiz → Question                | CASCADE         |
| Question → Option              | CASCADE         |
| Quiz → Attempt                 | CASCADE         |
| Attempt → Answer               | CASCADE         |
| Enrollment → Certificate       | CASCADE         |

Application/service layer tetap harus mencegah penghapusan data yang memiliki dependensi bisnis penting.

---

# 7. Indexing Strategy

Foreign key columns harus memiliki index untuk mendukung query relationship dan filtering.

Primary indexes:

```text
users:
- email
- employee_number
- role_id
- department_id
- is_active

courses:
- category_id
- status
- slug
- published_at

modules:
- course_id
- course_id + sort_order

materials:
- module_id
- module_id + sort_order

enrollments:
- user_id
- course_id
- status
- user_id + course_id

material_progress:
- enrollment_id
- material_id
- enrollment_id + material_id

quizzes:
- module_id
- status

questions:
- quiz_id
- quiz_id + sort_order

options:
- question_id

quiz_attempts:
- quiz_id
- user_id
- quiz_id + user_id
- quiz_id + user_id + attempt_number

quiz_answers:
- attempt_id
- question_id
- option_id

certificates:
- enrollment_id
- certificate_number
```

Tidak perlu membuat index secara berlebihan. Tambahkan index tambahan hanya jika dibutuhkan berdasarkan query atau hasil profiling.

---

# 8. Progress Calculation

Course progress dihitung berdasarkan mandatory materials.

Formula:

```text
progress =
completed mandatory materials
/
total mandatory materials
× 100
```

Contoh:

```text
Total mandatory materials: 10
Completed: 7

Progress = 7 / 10 × 100
         = 70%
```

Jika sebuah course tidak memiliki mandatory material, business logic harus menangani kondisi tersebut secara eksplisit.

Progress `100%` tidak otomatis berarti course `COMPLETED`.

Course completion juga membutuhkan persyaratan assessment apabila course memiliki required quiz.

---

# 9. Course Completion Rule

Course dapat dianggap completed apabila:

```text
1. Enrollment exists
2. Course is accessible
3. Semua mandatory materials selesai
4. Required quiz telah passed
```

Jika course tidak memiliki quiz wajib:

```text
All mandatory materials completed
        ↓
Course completed
```

Jika course memiliki quiz wajib:

```text
All mandatory materials completed
        +
Required quiz passed
        ↓
Course completed
```

Ketika completed:

```text
enrollments.status = COMPLETED
enrollments.completed_at = current timestamp
```

---

# 10. Certificate Rule

Certificate dibuat setelah enrollment memenuhi completion requirements.

Flow:

```text
Employee
   ↓
Enroll Course
   ↓
Complete Materials
   ↓
Take Required Quiz
   ↓
Pass Quiz
   ↓
Progress = 100%
   ↓
Enrollment = COMPLETED
   ↓
Generate Certificate
```

Certificate number harus unik.

Contoh format:

```text
ELMS-2026-000001
```

Format final dapat ditentukan pada application/service layer.

---

# 11. File Storage

File binary tidak disimpan langsung di PostgreSQL.

Database hanya menyimpan metadata/path:

```text
materials.file_path
courses.thumbnail
```

Storage abstraction menggunakan Laravel Filesystem.

MVP:

```text
Local Storage
```

Future:

```text
S3-compatible Object Storage
```

Database tetap hanya menyimpan reference/path terhadap file.

---

# 12. Soft Deletes

Soft delete tidak digunakan secara default pada semua tabel.

Gunakan soft delete hanya jika ada kebutuhan bisnis untuk mempertahankan historical data.

Untuk MVP:

* Users menggunakan `is_active`, bukan soft delete.
* Course menggunakan `status`, bukan soft delete.
* Historical enrollment dan certificate harus dipertahankan.
* Child learning data menggunakan cascade hanya ketika parent benar-benar dihapus sesuai business rule.

---

# 13. Audit and History

Audit log tidak termasuk database MVP.

Future enhancement:

```text
audit_logs
- id
- user_id
- action
- entity_type
- entity_id
- old_values
- new_values
- ip_address
- user_agent
- created_at
```

Audit log dapat digunakan untuk mencatat aktivitas administratif seperti:

* Create course
* Update course
* Publish course
* Delete material
* Change user role
* Deactivate user

---

# 14. Future Enhancements

Fitur berikut tidak termasuk MVP dan tidak boleh ditambahkan ke schema tanpa kebutuhan yang jelas:

* Manager role
* SSO integration
* HR system integration
* Organization-wide competency mapping
* Course prerequisites
* Course tags
* Multiple certificate templates
* Certificate QR verification
* Notifications
* Email notification history
* Discussion/forum
* Live classroom
* Advanced analytics
* Learning recommendation
* AI tutor
* Multi-language support

Schema dapat diperluas ketika requirement tersebut benar-benar dibutuhkan.

---

# 15. Database Migration Rules

Migration harus mengikuti dependency order.

Recommended order:

```text
1. roles
2. departments
3. users
4. categories
5. courses
6. course_instructors
7. modules
8. materials
9. enrollments
10. material_progress
11. quizzes
12. questions
13. options
14. quiz_attempts
15. quiz_answers
16. certificates
```

Migration harus:

* menggunakan foreign key constraint;
* menggunakan index yang didefinisikan pada dokumen ini;
* menggunakan unique constraint yang didefinisikan pada dokumen ini;
* tidak membuat tabel tambahan tanpa requirement;
* tidak menghapus atau mengubah schema existing tanpa alasan dan persetujuan;
* mengikuti Laravel migration conventions.

---

# 16. Seed Data

Development environment harus menyediakan seed data minimum untuk testing.

Recommended seed data:

### Roles

```text
Super Admin
Learning Admin
Instructor
Employee
```

### Departments

```text
IT Department
Human Resources
Training Department
Finance Department
```

### Users

Minimal:

```text
1 Super Admin
1 Learning Admin
2 Instructors
5 Employees
```

### Course

Minimal:

```text
1 DRAFT course
1 PUBLISHED course
1 ARCHIVED course
```

Published course harus memiliki:

```text
Category
Instructor
2+ Modules
Multiple Materials
At least 1 Quiz
Multiple Questions
Multiple Options
```

Seed credentials hanya untuk local development dan tidak boleh digunakan pada production.

---

# 17. Data Integrity Rules

Application layer wajib memastikan:

1. Employee hanya dapat enroll course `PUBLISHED`.
2. User hanya dapat memiliki satu enrollment per course.
3. Instructor hanya dapat mengelola course yang ditugaskan kepadanya.
4. Material hanya dapat dibuat di module yang valid.
5. Quiz hanya dapat dibuat di module yang valid.
6. Question hanya dapat dibuat pada quiz yang valid.
7. Option hanya dapat dibuat pada question yang valid.
8. Quiz answer harus menggunakan option dari question yang sama.
9. Employee tidak dapat melebihi `max_attempts`.
10. Submitted quiz attempt tidak dapat diubah.
11. Certificate hanya dapat dibuat untuk completed enrollment.
12. Satu enrollment hanya dapat memiliki satu certificate.
13. Progress dihitung dari material progress, bukan dari field percentage yang disimpan.
14. Semua operasi yang membutuhkan authorization harus melalui Policy/Middleware yang sesuai.

---

# 18. Transaction Requirements

Gunakan database transaction untuk operasi yang membutuhkan beberapa perubahan data yang harus berhasil atau gagal secara bersamaan.

Contoh:

### Submit quiz

```text
Create/update quiz attempt
        +
Save answers
        +
Calculate score
        +
Set passed status
```

Semua harus berada dalam transaction yang sesuai.

### Complete course

```text
Update enrollment
        +
Set completed_at
        +
Generate certificate
```

Harus diproses secara atomic untuk mencegah certificate dibuat ketika enrollment belum benar-benar completed.

---

# 19. Database Design Principles

ELMS database mengikuti prinsip:

* Normalized relational design
* Referential integrity
* Explicit foreign keys
* Appropriate indexing
* Minimal data duplication
* Business rules enforced at application layer
* Database constraints for data integrity
* Derived values calculated when possible
* Historical learning records preserved
* Schema designed around business domains rather than UI screens

Database design harus tetap sederhana untuk MVP tetapi memiliki struktur yang dapat dikembangkan menjadi production-scale application.

---

# 20. Source of Truth

Dokumen ini merupakan **database source of truth** untuk ELMS MVP.

Jika terdapat perbedaan antara implementasi dan dokumen ini:

```text
Requirement
    ↓
Database Design
    ↓
Migration
    ↓
Model
    ↓
Service
    ↓
API
```

Perubahan terhadap database schema harus dilakukan dengan memperbarui dokumen ini terlebih dahulu sebelum migration diubah.
