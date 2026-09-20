# ELMS API Documentation

## 1. Overview

ELMS menyediakan REST API sebagai communication layer antara React frontend dan Laravel backend.

API digunakan untuk:

* Authentication
* User management
* Course management
* Learning
* Assessment
* Certificate
* Dashboard
* Reporting

Base API:

```text
/api/v1
```

Format request dan response utama:

```text
JSON
```

---

# 2. API Principles

API harus mengikuti prinsip:

* RESTful resource naming
* HTTP method yang sesuai
* HTTP status code yang sesuai
* Consistent response format
* Server-side validation
* Backend authorization
* Pagination untuk collection
* API versioning
* Tidak mengekspos informasi internal server

---

# 3. Authentication

Authentication menggunakan Laravel Sanctum.

Protected endpoint membutuhkan authenticated user.

Contoh:

```http
Authorization: Bearer {token}
```

Authentication endpoint:

```text
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/departments
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

---

# 4. Standard Response

## Success

```json
{
    "success": true,
    "message": "Request successful",
    "data": {}
}
```

## Collection

```json
{
    "success": true,
    "message": "Courses retrieved successfully",
    "data": [],
    "meta": {
        "current_page": 1,
        "per_page": 10,
        "total": 50,
        "last_page": 5
    }
}
```

## Error

```json
{
    "success": false,
    "message": "Something went wrong",
    "errors": null
}
```

## Validation Error

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

---

# 5. HTTP Status Codes

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 200    | Successful request                       |
| 201    | Resource successfully created            |
| 204    | Successful request without response body |
| 400    | Bad request                              |
| 401    | Unauthenticated                          |
| 403    | Forbidden                                |
| 404    | Resource not found                       |
| 422    | Validation error                         |
| 429    | Too many requests                        |
| 500    | Internal server error                    |


# 6. Pagination

Collection endpoint menggunakan pagination.

Example:

```text
GET /api/v1/courses?page=1&per_page=10
```

Response:

```json
{
    "success": true,
    "message": "Courses retrieved successfully",
    "data": [],
    "meta": {
        "current_page": 1,
        "per_page": 10,
        "total": 100,
        "last_page": 10
    }
}
```

Default:

```text
per_page = 10
```

Maximum:

```text
per_page = 100
```

Backend harus membatasi nilai `per_page` agar tidak menyebabkan query terlalu besar.

---

# 7. Authentication API

## 7.1 Login

```http
POST /api/v1/auth/login
```

### Request

```json
{
    "email": "employee@example.com",
    "password": "password"
}
```

### Success Response

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "employee@example.com",
            "role": "EMPLOYEE"
        },
        "token": "..."
    }
}
```

### Error

```text
401 Unauthorized
```

Jika credentials tidak valid.

---

## 7.2 Register

```http
POST /api/v1/auth/register
```

Endpoint pendaftaran mandiri karyawan (*self-registration*). Publicly accessible. Server secara otoritatif menetapkan `role = EMPLOYEE` dan menolak/mengabaikan eskalasi hak akses (seperti `role`, `role_id`, atau `is_admin`).

### Request

```json
{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "password_confirmation": "Password123!",
    "department_id": 1
}
```

### Validation Rules

* `name`: required, string, max: 150
* `email`: required, valid email, unique:users, max: 255
* `password`: required, string, confirmed, Password::defaults() (min 8 chars in local/testing)
* `password_confirmation`: required, string
* `department_id`: required, integer, exists:departments,id

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "user": {
            "id": 12,
            "name": "Jane Doe",
            "email": "jane@example.com",
            "role": "EMPLOYEE",
            "department": {
                "id": 1,
                "name": "Pusat Teknologi Informasi dan Komunikasi"
            }
        },
        "token": "..."
    }
}
```

---

## 7.3 Forgot Password

```http
POST /api/v1/auth/forgot-password
```

Mengirim link reset password ke email terdaftar menggunakan Laravel native password broker. Mengimplementasikan *anti-enumeration security*: response generic yang sama dikembalikan untuk email terdaftar maupun yang tidak terdaftar.

### Request

```json
{
    "email": "employee@example.com"
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "If the account exists, a password reset link has been sent.",
    "data": null
}
```

---

## 7.4 Reset Password

```http
POST /api/v1/auth/reset-password
```

Mereset password akun pengguna menggunakan token valid dari email. Menggunakan Laravel password broker dan merevokasi seluruh token Sanctum aktif setelah reset berhasil.

### Request

```json
{
    "token": "d748f...",
    "email": "employee@example.com",
    "password": "NewSecret123!",
    "password_confirmation": "NewSecret123!"
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Password has been reset successfully.",
    "data": null
}
```

### Error Response (400 Bad Request)

```json
{
    "success": false,
    "message": "This password reset token is invalid.",
    "errors": null
}
```

---

## 7.5 Public Departments for Registration

```http
GET /api/v1/auth/departments
```

Menyediakan daftar departemen aktif (`id`, `name`) untuk form dropdown registrasi mandiri publik tanpa memerlukan sesi otentikasi Sanctum.

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Departments retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "Biro Kepegawaian"
        },
        {
            "id": 2,
            "name": "Pusat Teknologi Informasi dan Komunikasi"
        }
    ]
}
```

---

## 7.6 Logout

```http
POST /api/v1/auth/logout
```

Authentication:

```text
Required
```

Response:

```json
{
    "success": true,
    "message": "Logout successful",
    "data": null
}
```

---

## 7.7 Current User

```http
GET /api/v1/auth/me
```

Authentication:

```text
Required
```

Response:

```json
{
    "success": true,
    "message": "Authenticated user retrieved successfully",
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "employee@example.com",
        "role": "EMPLOYEE",
        "department": {
            "id": 1,
            "name": "IT Department"
        }
    }
}
```

---

# 8. Users API

Base:

```text
/api/v1/users
```

## 8.1 List Users

```http
GET /api/v1/users
```

Access:

```text
SUPER_ADMIN
LEARNING_ADMIN
```

Query:

```text
?page=1
&per_page=10
&search=john
&role=EMPLOYEE
&department_id=1
&is_active=true
```

Response:

```json
{
    "success": true,
    "message": "Users retrieved successfully",
    "data": [
        {
            "id": 4,
            "name": "John Doe",
            "email": "john@example.com",
            "employee_number": "EMP001",
            "is_active": true,
            "role": {
                "id": 4,
                "name": "EMPLOYEE"
            },
            "department": {
                "id": 1,
                "name": "IT Department"
            },
            "created_at": "2026-01-01T10:00:00+00:00",
            "updated_at": "2026-01-01T10:00:00+00:00"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 10,
        "total": 1,
        "last_page": 1
    }
}
```

`per_page` is capped at 100 per §6. `role` filters by role name (e.g. `EMPLOYEE`), not `role_id`.

---

## 8.2 Create User

```http
POST /api/v1/users
```

Request:

```json
{
    "name": "John Doe",
    "employee_number": "EMP001",
    "email": "john@example.com",
    "password": "password",
    "role_id": 4,
    "department_id": 1
}
```

Response:

```text
201 Created
```

Response body follows the same `user` shape shown in §8.1 (single object under `data`, no `meta`). The password is never included in the response.

---

## 8.3 Get User

```http
GET /api/v1/users/{id}
```

Response body follows the same `user` shape shown in §8.1 (single object under `data`).

---

## 8.4 Update User

```http
PUT /api/v1/users/{id}
```

Also accepts `PATCH` for partial updates. Fields are optional (`sometimes`) except where noted.

Request:

```json
{
    "name": "John Doe Updated",
    "employee_number": "EMP001",
    "email": "john@example.com",
    "role_id": 4,
    "department_id": 1
}
```

### Role/department authorization rules

* A user can never change their own `role_id` (self role-escalation guard), regardless of role — returns `403`.
* `LEARNING_ADMIN` cannot update (or change the status of) a user whose current role is `SUPER_ADMIN` or `LEARNING_ADMIN` — returns `403`.
* `LEARNING_ADMIN` cannot assign the `SUPER_ADMIN` or `LEARNING_ADMIN` role to any user — returns `403`.
* `SUPER_ADMIN` is not subject to the above two restrictions (only the self role-change guard applies).

---

## 8.5 Activate / Deactivate User

```http
PATCH /api/v1/users/{id}/status
```

Request:

```json
{
    "is_active": false
}
```

---

# 9. Departments API

Base:

```text
/api/v1/departments
```

## 9.1 List Departments

```http
GET /api/v1/departments
```

Access:

```text
Authenticated (SUPER_ADMIN, LEARNING_ADMIN, INSTRUCTOR, EMPLOYEE)
```

Query Parameters:

```text
?page=1
&per_page=15
&search=teknologi
&parent_id=1
&sort_by=name
&sort_direction=asc
```

Response:

```json
{
    "success": true,
    "message": "Departments retrieved successfully",
    "data": [
        {
            "id": 1,
            "name": "Pusat Teknologi Informasi dan Komunikasi",
            "code": "PUSDATIN",
            "description": "Pengelolaan infrastruktur dan sistem informasi",
            "parent_id": null,
            "parent": null,
            "children": [],
            "users_count": 5,
            "created_at": "2026-01-01T10:00:00+00:00",
            "updated_at": "2026-01-01T10:00:00+00:00"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 1,
        "last_page": 1
    }
}
```

---

## 9.2 Create Department

```http
POST /api/v1/departments
```

Access:

```text
SUPER_ADMIN
LEARNING_ADMIN
```

Request:

```json
{
    "name": "Pusat Teknologi Informasi dan Komunikasi",
    "code": "PUSDATIN",
    "description": "Pengelolaan infrastruktur dan sistem informasi",
    "parent_id": null
}
```

Response:

```text
201 Created
```

```json
{
    "success": true,
    "message": "Department created successfully",
    "data": {
        "id": 1,
        "name": "Pusat Teknologi Informasi dan Komunikasi",
        "code": "PUSDATIN",
        "description": "Pengelolaan infrastruktur dan sistem informasi",
        "parent_id": null,
        "parent": null,
        "children": [],
        "users_count": 0,
        "created_at": "2026-01-01T10:00:00+00:00",
        "updated_at": "2026-01-01T10:00:00+00:00"
    }
}
```

---

## 9.3 Get Department

```http
GET /api/v1/departments/{id}
```

Access:

```text
Authenticated (SUPER_ADMIN, LEARNING_ADMIN, INSTRUCTOR, EMPLOYEE)
```

Response:

```text
200 OK
```

```json
{
    "success": true,
    "message": "Department retrieved successfully",
    "data": {
        "id": 1,
        "name": "Pusat Teknologi Informasi dan Komunikasi",
        "code": "PUSDATIN",
        "description": "Pengelolaan infrastruktur dan sistem informasi",
        "parent_id": null,
        "parent": null,
        "children": [
            {
                "id": 2,
                "name": "Bidang Pengembangan Sistem",
                "code": "BANGSIS"
            }
        ],
        "users_count": 5,
        "created_at": "2026-01-01T10:00:00+00:00",
        "updated_at": "2026-01-01T10:00:00+00:00"
    }
}
```

---

## 9.4 Update Department

```http
PUT /api/v1/departments/{id}
```

Also accepts `PATCH`.

Access:

```text
SUPER_ADMIN
LEARNING_ADMIN
```

Request:

```json
{
    "name": "Pusat Data dan Informasi",
    "code": "PUSDATIN-REV",
    "description": "Unit pengelola data strategis",
    "parent_id": null
}
```

Rules:
* A department cannot be its own parent or a descendant of itself (circular hierarchy guard) — returns `422`.
* `name` and `code` uniqueness are validated excluding current department ID.

Response:

```text
200 OK
```

---

## 9.5 Delete Department

```http
DELETE /api/v1/departments/{id}
```

Access:

```text
SUPER_ADMIN only
```

Rules:
* Cannot delete if department has child departments — returns `422 Unprocessable Content`.
* Cannot delete if department has assigned users — returns `422 Unprocessable Content`.

Response:

```text
200 OK
```

```json
{
    "success": true,
    "message": "Department deleted successfully",
    "data": null
}
```

---

# 10. Categories API

Base:

```text
/api/v1/categories
```

## 10.1 List Categories

```http
GET /api/v1/categories
```

---

## 10.2 Create Category

```http
POST /api/v1/categories
```

Request:

```json
{
    "name": "Software Development",
    "description": "Software development courses"
}
```

---

## 10.3 Update Category

```http
PUT /api/v1/categories/{id}
```

---

## 10.4 Delete Category

```http
DELETE /api/v1/categories/{id}
```

Category tidak boleh dihapus jika masih digunakan oleh course, kecuali business rule mengizinkan tindakan tersebut.

---

# 11. Courses API

Base:

```text
/api/v1/courses
```

---

## 11.1 List Courses

```http
GET /api/v1/courses
```

Query:

```text
?page=1
&per_page=10
&search=laravel
&category_id=1
&status=PUBLISHED
```

Response:

```json
{
    "success": true,
    "message": "Courses retrieved successfully",
    "data": [
        {
            "id": 1,
            "title": "Laravel Backend Development",
            "slug": "laravel-backend-development",
            "category": {
                "id": 1,
                "name": "Software Development"
            },
            "estimated_duration": 240,
            "status": "PUBLISHED"
        }
    ],
    "meta": {}
}
```

---

## 11.2 Create Course

```http
POST /api/v1/courses
```

Request:

```json
{
    "title": "Laravel Backend Development",
    "category_id": 1,
    "description": "Learn Laravel backend development",
    "estimated_duration": 240
}
```

Response:

```text
201 Created
```

Initial status:

```text
DRAFT
```

---

## 11.3 Get Course

```http
GET /api/v1/courses/{id}
```

Response dapat mencakup:

* Course information
* Category
* Instructor
* Modules
* Materials
* Quiz summary

---

## 11.4 Update Course

```http
PUT /api/v1/courses/{id}
```

---

## 11.5 Delete Course

```http
DELETE /api/v1/courses/{id}
```

Deletion harus mengikuti business rule dan referential integrity database.

---

## 11.6 Update Course Status

```http
PATCH /api/v1/courses/{id}/status
```

Request:

```json
{
    "status": "PUBLISHED"
}
```

Allowed:

```text
DRAFT
PUBLISHED
ARCHIVED
```

---

# 12. Instructor API

## 12.1 Assign Instructor

```http
POST /api/v1/courses/{course}/instructors
```

Request:

```json
{
    "user_id": 10
}
```

---

## 12.2 Remove Instructor

```http
DELETE /api/v1/courses/{course}/instructors/{user}
```

---

## 12.3 List Course Instructors

```http
GET /api/v1/courses/{course}/instructors
```

---

# 13. Modules API

Base:

```text
/api/v1
```

## 13.1 Create Module

```http
POST /api/v1/courses/{course}/modules
```

Request:

```json
{
    "title": "Introduction",
    "description": "Introduction to the course"
}
```

---

## 13.2 Update Module

```http
PUT /api/v1/modules/{module}
```

---

## 13.3 Delete Module

```http
DELETE /api/v1/modules/{module}
```

---

## 13.4 Reorder Modules

```http
PATCH /api/v1/courses/{course}/modules/reorder
```

Request:

```json
{
    "modules": [
        {
            "id": 3,
            "sort_order": 1
        },
        {
            "id": 1,
            "sort_order": 2
        },
        {
            "id": 2,
            "sort_order": 3
        }
    ]
}
```

---

# 14. Materials API

## 14.1 Create Material

```http
POST /api/v1/modules/{module}/materials
```

For text:

```json
{
    "title": "Introduction",
    "type": "TEXT",
    "content": "Learning material content",
    "is_mandatory": true
}
```

For video:

```json
{
    "title": "Laravel Introduction",
    "type": "VIDEO",
    "video_url": "https://example.com/video",
    "is_mandatory": true
}
```

For PDF:

```text
multipart/form-data
```

Fields:

```text
title
type=PDF
file
is_mandatory
```

---

## 14.2 Update Material

```http
PUT /api/v1/materials/{material}
```

---

## 14.3 Delete Material

```http
DELETE /api/v1/materials/{material}
```

---

## 14.4 Reorder Materials

```http
PATCH /api/v1/modules/{module}/materials/reorder
```

Request:

```json
{
    "materials": [
        {
            "id": 5,
            "sort_order": 1
        },
        {
            "id": 7,
            "sort_order": 2
        }
    ]
}
```

---

# 15. Enrollment API

## 15.1 Enroll Course

```http
POST /api/v1/courses/{course}/enroll
```

Access:

```text
EMPLOYEE
```

Rules:

* Course harus PUBLISHED.
* User belum memiliki enrollment pada course tersebut.
* User harus active.

Response:

```text
201 Created
```

Example:

```json
{
    "success": true,
    "message": "Course enrolled successfully",
    "data": {
        "id": 1,
        "course_id": 10,
        "status": "ENROLLED"
    }
}
```

---

## 15.2 My Courses

```http
GET /api/v1/my-courses
```

Query:

```text
?status=IN_PROGRESS
```

---

## 15.3 Enrollment Detail

```http
GET /api/v1/enrollments/{enrollment}
```

User hanya dapat mengakses enrollment yang memang menjadi haknya, kecuali role memiliki administrative permission.

---

# 16. Learning Progress API

## 16.1 Get Progress

```http
GET /api/v1/enrollments/{enrollment}/progress
```

Response:

```json
{
    "success": true,
    "message": "Learning progress retrieved successfully",
    "data": {
        "enrollment_id": 1,
        "course_id": 10,
        "status": "IN_PROGRESS",
        "progress": 60,
        "total_mandatory_materials": 10,
        "completed_mandatory_materials": 6
    }
}
```

Progress dihitung oleh backend.

---

## 16.2 Complete Material

```http
POST /api/v1/enrollments/{enrollment}/materials/{material}/complete
```

Response:

```json
{
    "success": true,
    "message": "Material marked as completed",
    "data": {
        "material_id": 20,
        "completed_at": "2026-01-01T10:00:00Z",
        "progress": 70
    }
}
```

Backend harus memastikan:

* Enrollment valid.
* Enrollment dimiliki user.
* Material berasal dari course enrollment.
* Material belum completed atau operasi bersifat idempotent.

---

# 17. Quiz API

## 17.1 Create Quiz

```http
POST /api/v1/modules/{module}/quizzes
```

Request:

```json
{
    "title": "Final Assessment",
    "description": "Final assessment",
    "passing_grade": 70,
    "max_attempts": 3,
    "time_limit_minutes": 30
}
```

Initial status:

```text
DRAFT
```

---

## 17.2 Get Quiz

```http
GET /api/v1/quizzes/{quiz}
```

Employee hanya dapat melihat quiz yang tersedia untuk course yang diikuti.

Correct answer tidak boleh dikirim sebelum quiz submission.

---

## 17.3 Update Quiz

```http
PUT /api/v1/quizzes/{quiz}
```

---

## 17.4 Delete Quiz

```http
DELETE /api/v1/quizzes/{quiz}
```

---

## 17.5 Update Quiz Status

```http
PATCH /api/v1/quizzes/{quiz}/status
```

Request:

```json
{
    "status": "PUBLISHED"
}
```

---

# 18. Question API

## 18.1 Create Question

```http
POST /api/v1/quizzes/{quiz}/questions
```

Request:

```json
{
    "question": "What is Laravel?",
    "options": [
        {
            "option_text": "PHP Framework",
            "is_correct": true
        },
        {
            "option_text": "Database",
            "is_correct": false
        },
        {
            "option_text": "Operating System",
            "is_correct": false
        }
    ]
}
```

Backend validation harus memastikan:

* Minimal satu option.
* Tepat satu correct option.
* Question belongs to the quiz.

---

## 18.2 Update Question

```http
PUT /api/v1/questions/{question}
```

---

## 18.3 Delete Question

```http
DELETE /api/v1/questions/{question}
```

---

# 19. Quiz Attempt API

## 19.1 Start Quiz

```http
POST /api/v1/quizzes/{quiz}/attempts
```

Response:

```json
{
    "success": true,
    "message": "Quiz attempt started",
    "data": {
        "id": 100,
        "quiz_id": 10,
        "attempt_number": 1,
        "started_at": "2026-01-01T10:00:00Z",
        "questions": []
    }
}
```

Correct options tidak boleh dikirim.

---

## 19.2 Get Attempt

```http
GET /api/v1/attempts/{attempt}
```

---

## 19.3 Submit Attempt

```http
POST /api/v1/attempts/{attempt}/submit
```

Request:

```json
{
    "answers": [
        {
            "question_id": 1,
            "option_id": 4
        },
        {
            "question_id": 2,
            "option_id": 7
        }
    ]
}
```

Backend:

1. Validate attempt.
2. Validate answers.
3. Validate question/option relationship.
4. Calculate score.
5. Determine pass/fail.
6. Save answers.
7. Mark attempt submitted.
8. Update learning completion if requirements are satisfied.

Process harus menggunakan database transaction.

---

## 19.4 Attempt Result

Submit response:

```json
{
    "success": true,
    "message": "Quiz submitted successfully",
    "data": {
        "attempt_id": 100,
        "score": 80,
        "passing_grade": 70,
        "passed": true,
        "submitted_at": "2026-01-01T10:25:00Z"
    }
}
```

---

# 20. Certificate API

## 20.1 Issue Certificate

```http
POST /api/v1/enrollments/{enrollment}/certificate
```

Response (New Certificate - 201 Created):

```json
{
    "success": true,
    "message": "Certificate issued successfully",
    "data": {
        "id": 1,
        "certificate_number": "ELMS-2026-000001",
        "enrollment_id": 5,
        "course": {
            "id": 10,
            "title": "Laravel Backend Development",
            "slug": "laravel-backend-development"
        },
        "employee": {
            "id": 20,
            "name": "John Doe",
            "nip": "199001012020121001"
        },
        "issued_at": "2026-01-01T12:00:00Z",
        "created_at": "2026-01-01T12:00:00Z"
    }
}
```

Response (Already Issued - 200 OK):

```json
{
    "success": true,
    "message": "Certificate already issued",
    "data": {
        "id": 1,
        "certificate_number": "ELMS-2026-000001",
        "enrollment_id": 5,
        "course": {
            "id": 10,
            "title": "Laravel Backend Development",
            "slug": "laravel-backend-development"
        },
        "employee": {
            "id": 20,
            "name": "John Doe",
            "nip": "199001012020121001"
        },
        "issued_at": "2026-01-01T12:00:00Z",
        "created_at": "2026-01-01T12:00:00Z"
    }
}
```

---

## 20.2 My Certificates

```http
GET /api/v1/my-certificates
```

---

## 20.3 List Certificates (Admin & Instructor)

```http
GET /api/v1/certificates
```

Query Parameters:
- `course_id`: Filter by course
- `user_id`: Filter by employee
- `page`: Page number

---

## 20.4 Certificate Detail

```http
GET /api/v1/certificates/{certificate}
```

Response:

```json
{
    "success": true,
    "message": "Certificate retrieved successfully",
    "data": {
        "id": 1,
        "certificate_number": "ELMS-2026-000001",
        "course": {
            "id": 10,
            "title": "Laravel Backend Development"
        },
        "employee": {
            "id": 20,
            "name": "John Doe"
        },
        "issued_at": "2026-01-01T12:00:00Z"
    }
}
```

---

## 20.3 Certificate Verification

Future enhancement:

```http
GET /api/v1/certificates/verify/{certificateNumber}
```

Endpoint ini dapat dibuat public apabila certificate verification diperlukan.

Bukan bagian dari MVP wajib.

---

# 21. Dashboard API

## 21.1 Dashboard

```http
GET /api/v1/dashboard
```

Response disesuaikan berdasarkan role.

### Employee

```json
{
    "success": true,
    "message": "Dashboard retrieved successfully",
    "data": {
        "total_courses": 5,
        "in_progress": 2,
        "completed": 3,
        "certificates": 3
    }
}
```

### Admin

```json
{
    "success": true,
    "message": "Dashboard retrieved successfully",
    "data": {
        "total_employees": 150,
        "total_courses": 25,
        "published_courses": 20,
        "total_enrollments": 500,
        "completed_courses": 300,
        "average_quiz_score": 82.5
    }
}
```

---

# 22. Reports API

## 22.1 Course Report

```http
GET /api/v1/reports/courses
```

Query:

```text
?page=1
&per_page=10
&course_id=1
```

---

## 22.2 Learning Report

```http
GET /api/v1/reports/learning
```

Query:

```text
?page=1
&per_page=10
&course_id=1
&department_id=2
&status=COMPLETED
```

---

## 22.3 Quiz Report

```http
GET /api/v1/reports/quiz
```

Query:

```text
?page=1
&per_page=10
&quiz_id=1
```

---

# 23. Notifications API

Base:

```text
/api/v1/notifications
```

## 23.1 List Notifications

```http
GET /api/v1/notifications
```

Query:

```text
?unread=true
&type=COURSE_ENROLLED
&page=1
&per_page=15
```

Response:

```json
{
    "success": true,
    "message": "Notifications retrieved successfully",
    "data": [
        {
            "id": 1,
            "type": "COURSE_ENROLLED",
            "title": "Course Enrollment Confirmed",
            "message": "You have successfully enrolled in Laravel Backend Development.",
            "data": {
                "course_id": 10,
                "course_title": "Laravel Backend Development",
                "slug": "laravel-backend-development"
            },
            "is_read": false,
            "read_at": null,
            "created_at": "2026-09-20T10:00:00.000000Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 1,
        "last_page": 1,
        "unread_count": 1
    }
}
```

## 23.2 Unread Count

```http
GET /api/v1/notifications/unread-count
```

Response:

```json
{
    "success": true,
    "message": "Unread notification count retrieved successfully",
    "data": {
        "unread_count": 1
    }
}
```

## 23.3 Mark Notification as Read

```http
PATCH /api/v1/notifications/{notification}/read
```

## 23.4 Mark All as Read

```http
PATCH /api/v1/notifications/read-all
```

## 23.5 Delete Notification

```http
DELETE /api/v1/notifications/{notification}
```

---

# 24. Authorization Matrix

| Endpoint Area   | Super Admin | Learning Admin |   Instructor | Employee |
| --------------- | ----------: | -------------: | -----------: | -------: |
| Auth            |         Yes |            Yes |          Yes |      Yes |
| Users           |        Full |        Limited |           No |       No |
| Departments     |        Full |        Limited |           No |       No |
| Categories      |        Full |           Full |           No |       No |
| Courses         |        Full |           Full |     Assigned |     Read |
| Modules         |        Full |           Full |     Assigned |     Read |
| Materials       |        Full |           Full |     Assigned |     Read |
| Enrollment      |        Full |           Full | Own/Assigned |      Own |
| Progress        |        Full |           Full |     Assigned |      Own |
| Quiz Management |        Full |           Full |     Assigned |       No |
| Quiz Attempt    |        Full |           Full |          Own |      Own |
| Certificates    |        Full |           Full |         Read |      Own |
| Reports         |        Full |           Full |      Limited |      Own |
| Notifications   |         Own |            Own |          Own |      Own |

Authorization harus diterapkan pada backend menggunakan middleware/policies.

---

# 24. Validation Rules

Validation dilakukan di Laravel menggunakan Form Request.

Contoh Course:

```text
title
required|string|max:255

category_id
required|exists:categories,id

description
nullable|string

estimated_duration
required|integer|min:1

status
sometimes|in:DRAFT,PUBLISHED,ARCHIVED
```

Contoh Enrollment:

```text
course
exists:published course

user
authenticated

duplicate enrollment
not allowed
```

Contoh Quiz:

```text
passing_grade
required|numeric|min:0|max:100

max_attempts
required|integer|min:1

time_limit_minutes
nullable|integer|min:1
```

---

# 25. API Security Rules

API harus:

* Memvalidasi authentication.
* Memvalidasi authorization.
* Memvalidasi request.
* Menggunakan parameterized queries/Eloquent.
* Tidak mengekspos password.
* Tidak mengekspos correct answer sebelum submission.
* Tidak mengekspos server path.
* Tidak mengekspos SQL error.
* Menggunakan rate limiting pada endpoint sensitif.
* Memvalidasi ownership resource.

---

# 26. Resource Ownership

User hanya boleh mengakses resource yang menjadi haknya.

Contoh:

Employee A:

```text
Enrollment #10
```

Employee B tidak boleh mengakses:

```http
GET /api/v1/enrollments/10
```

Backend harus memvalidasi ownership.

Hal yang sama berlaku untuk:

* Learning progress
* Quiz attempts
* Certificates
* Employee-specific reports

---

# 27. Idempotency

Operation tertentu harus aman jika request dikirim lebih dari satu kali.

Contoh:

```http
POST /api/v1/enrollments/{enrollment}/materials/{material}/complete
```

Jika material sudah completed, request berikutnya tidak boleh membuat duplicate `material_progress`.

Database unique constraint tetap menjadi protection layer.

---

# 28. API Filtering & Search

Collection endpoint dapat mendukung filtering sesuai kebutuhan.

Contoh:

```text
GET /api/v1/courses?status=PUBLISHED
```

Search:

```text
GET /api/v1/courses?search=laravel
```

Multiple filter:

```text
GET /api/v1/courses?status=PUBLISHED&category_id=1
```

Tidak semua endpoint wajib memiliki semua filter.

Filter hanya ditambahkan jika memang diperlukan oleh feature.

---

# 29. API Sorting

Collection dapat mendukung sorting jika diperlukan.

Contoh:

```text
GET /api/v1/courses?sort_by=created_at&sort_direction=desc
```

Backend harus melakukan whitelist terhadap field yang dapat digunakan untuk sorting.

Client tidak boleh memasukkan arbitrary SQL field.

---

# 30. API Relationship Loading

API hanya mengembalikan relationship yang diperlukan oleh client.

Hindari response yang terlalu besar.

Contoh course list:

```json
{
    "id": 1,
    "title": "Laravel Backend",
    "category": {
        "id": 1,
        "name": "Development"
    }
}
```

Course detail dapat mengembalikan:

```text
Course
 ├── Category
 ├── Instructors
 └── Modules
      └── Materials
```

API harus menghindari N+1 query menggunakan eager loading jika diperlukan.

---

# 31. API Error Handling

Contoh 401:

```json
{
    "success": false,
    "message": "Unauthenticated",
    "errors": null
}
```

Contoh 403:

```json
{
    "success": false,
    "message": "You are not authorized to perform this action",
    "errors": null
}
```

Contoh 404:

```json
{
    "success": false,
    "message": "Resource not found",
    "errors": null
}
```

Contoh 422:

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

Contoh 500:

```json
{
    "success": false,
    "message": "An internal server error occurred",
    "errors": null
}
```

Production response tidak boleh menampilkan exception detail.

Sejak Task 03 (Users module), `bootstrap/app.php` memetakan `AuthenticationException` (401), `AuthorizationException` (403), `ValidationException` (422), dan `ModelNotFoundException`/`NotFoundHttpException` (404) ke envelope `ApiResponse` di atas untuk seluruh route `api/*`, sehingga contoh-contoh di section ini berlaku otomatis tanpa perlu ditangani manual di setiap controller.

---

# 32. API Route Organization

Route dapat diorganisasikan berdasarkan module.

Contoh:

```text
app/Modules/Authentication/Routes/api.php
app/Modules/Users/Routes/api.php
app/Modules/Courses/Routes/api.php
app/Modules/Learning/Routes/api.php
app/Modules/Assessments/Routes/api.php
app/Modules/Certificates/Routes/api.php
app/Modules/Reports/Routes/api.php
```

Semua route menggunakan API prefix:

```text
/api/v1
```

Route module kemudian diregistrasikan oleh Laravel application.

---

# 33. API Testing

Critical API endpoint harus memiliki automated test.

Minimal:

### Authentication

```text
Login success
Login invalid credentials
Inactive user cannot login
Logout
Current user
```

### Courses

```text
Create course
Get courses
Update course
Publish course
Unauthorized course access
```

### Enrollment

```text
Enroll published course
Cannot enroll draft course
Cannot duplicate enrollment
```

### Learning

```text
Complete material
Cannot complete material from another course
Progress calculation
Course completion
```

### Quiz

```text
Start quiz
Submit quiz
Score calculation
Pass/fail
Attempt limitation
Invalid option
Cannot submit submitted attempt
```

### Certificate

```text
Generate certificate after completion
Cannot generate certificate before completion
Duplicate certificate prevented
```

---

# 34. API Versioning

Current version:

```text
v1
```

Base:

```text
/api/v1
```

Breaking changes harus menggunakan API version baru jika diperlukan.

Contoh future:

```text
/api/v2
```

Jangan mengubah existing API contract secara breaking tanpa alasan dan dokumentasi.

---

# 35. API Documentation Convention

Setiap endpoint baru harus didokumentasikan dengan:

1. HTTP method.
2. URL.
3. Authentication requirement.
4. Allowed roles.
5. Request parameters.
6. Request body.
7. Validation rules.
8. Success response.
9. Error response.
10. Business rules.

---

# 36. Definition of Done

API feature dianggap selesai apabila:

* Endpoint tersedia.
* Route terdaftar.
* Authentication diterapkan jika diperlukan.
* Authorization diterapkan.
* Form Request validation tersedia.
* Business logic berada di Service.
* Response format konsisten.
* Error handling tersedia.
* Critical test tersedia.
* Tidak ada unauthorized resource access.
* Documentation diperbarui.

---

# 37. API Development Priority

API akan dikembangkan secara bertahap:

```text
1. Authentication
       ↓
2. Users
       ↓
3. Categories
       ↓
4. Courses
       ↓
5. Modules
       ↓
6. Materials
       ↓
7. Enrollment
       ↓
8. Learning Progress
       ↓
9. Quiz
       ↓
10. Certificate
       ↓
11. Dashboard
       ↓
12. Reports
       ↓
13. Notifications
```

---

# 38. Source of Truth

API harus mengikuti:

```text
docs/requirements.md
        ↓
docs/architecture.md
        ↓
docs/database.md
        ↓
docs/modules.md
        ↓
docs/api.md
```

Jika API membutuhkan perubahan business rule atau database schema, dokumentasi terkait harus diperbarui terlebih dahulu atau bersamaan dengan implementation.

API contract dan implementation harus tetap sinkron.

---

# 39. Final API Resource Map

```text
/api/v1
│
├── auth
│   ├── login
│   ├── logout
│   └── me
│
├── users
├── departments
├── categories
│
├── courses
│   ├── instructors
│   └── modules
│       └── materials
│
├── my-courses
├── enrollments
│   └── progress
│
├── quizzes
│   ├── questions
│   └── attempts
│
├── certificates
│
├── dashboard
│
├── reports
│   ├── courses
│   ├── learning
│   └── quiz
│
└── notifications
    ├── unread-count
    ├── read-all
    └── {notification}
        └── read
```

Dokumen ini merupakan API contract awal untuk ELMS MVP dan dapat berkembang mengikuti implementation, selama perubahan tetap konsisten dengan requirements, architecture, database, dan module boundaries.
