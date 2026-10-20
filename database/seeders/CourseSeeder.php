<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\Material;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $catSE = Category::where('slug', 'software-engineering')->firstOrFail();
        $catSec = Category::where('slug', 'cyber-security')->firstOrFail();
        $catLead = Category::where('slug', 'leadership-management')->firstOrFail();

        $instructor = User::where('email', 'instructor@elms.test')->firstOrFail();

        // 1. Course: Arsitektur Web Enterprise Modern
        $course1 = Course::query()->updateOrCreate(
            ['slug' => 'arsitektur-web-enterprise-modern'],
            [
                'category_id' => $catSE->id,
                'title' => 'Arsitektur Web Enterprise Modern',
                'description' => 'Mempelajari implementasi Modular Monolith, RESTful API, dan transactional integrity menggunakan Laravel dan PostgreSQL.',
                'estimated_duration' => 240,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course1->instructors()->syncWithoutDetaching([$instructor->id]);

        $mod1 = Module::query()->updateOrCreate(
            ['course_id' => $course1->id, 'sort_order' => 1],
            ['title' => 'Prinsip Modular Monolith', 'description' => 'Konsep domain boundaries dan thin controllers.']
        );

        Material::query()->updateOrCreate(
            ['module_id' => $mod1->id, 'sort_order' => 1],
            [
                'title' => 'Pengenalan Modular Monolith & Domain Boundaries',
                'type' => Material::TYPE_TEXT,
                'content' => 'Modular Monolith memisahkan sistem ke dalam modul-modul independen yang terisolasi dengan kontrak service yang jelas.',
                'is_mandatory' => true,
            ]
        );

        Material::query()->updateOrCreate(
            ['module_id' => $mod1->id, 'sort_order' => 2],
            [
                'title' => 'Panduan Layering Controller, Service & Eloquent',
                'type' => Material::TYPE_PDF,
                'file_path' => 'materials/modular-monolith-guide.pdf',
                'is_mandatory' => true,
            ]
        );

        if (! Storage::disk('local')->exists('materials/modular-monolith-guide.pdf') || Storage::disk('local')->size('materials/modular-monolith-guide.pdf') < 2000) {
            $stream = file_exists(storage_path('app/private/materials/modular-monolith-guide.pdf')) && filesize(storage_path('app/private/materials/modular-monolith-guide.pdf')) > 2000
                ? file_get_contents(storage_path('app/private/materials/modular-monolith-guide.pdf'))
                : "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> >>\nendobj\n5 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 8 0 R /Resources << /Font << /F1 9 0 R /F2 10 0 R >> >> >>\nendobj\n6 0 obj\n<< /Length 1085 >>\nstream\nBT\n/F1 15 Tf\n50 740 Td\n(ELMS INTERNAL ENGINEERING ACADEMY) Tj\n/F1 19 Tf\n0 -30 Td\n(Panduan Layering Controller, Service & Eloquent) Tj\n/F2 11 Tf\n0 -24 Td\n(Modul 1: Prinsip Modular Monolith dan Domain Boundaries) Tj\n/F1 13 Tf\n0 -32 Td\n(1. Filosofi Modular Monolith) Tj\n/F2 10 Tf\n0 -20 Td\n(ELMS dibangun menggunakan arsitektur Modular Monolith untuk mensimulasikan sistem enterprise) Tj\n0 -16 Td\n(yang terstruktur rapi tanpa kompleksitas operasional microservices. Setiap domain fungsional) Tj\n0 -16 Td\n((Courses, Learning, Assessments, Certificates) dikelompokkan dalam modul terisolasi.) Tj\n0 -24 Td\n(Prinsip utama domain boundaries:) Tj\n0 -16 Td\n(- Modul dilarang mengakses model atau tabel modul lain secara liar tanpa kontrak service.) Tj\n0 -16 Td\n(- Seluruh interaksi lintas domain wajib melalui Service publik dari modul tujuan.) Tj\n0 -16 Td\n(- Database PostgreSQL menggunakan skema relasional yang konsisten dengan foreign keys ketat.) Tj\n0 -24 Td\n(Keuntungan utama: modularitas tinggi, refactoring aman, dan kemudahan testing unit/feature.) Tj\n/F2 9 Tf\n0 -220 Td\n(Halaman 1 dari 3 - Lanjutkan membaca ke Halaman 2 untuk panduan clean layering) Tj\nET\nendstream\nendobj\n7 0 obj\n<< /Length 1215 >>\nstream\nBT\n/F1 16 Tf\n50 740 Td\n(2. Tiga Prinsip Clean Layering pada Laravel) Tj\n/F2 10 Tf\n0 -28 Td\n(Untuk mencegah controller menjadi gemuk (Fat Controller), ELMS membagi tanggung jawab ke 3 lapis:) Tj\n/F1 12 Tf\n0 -28 Td\n(Layer A: FormRequest (Validasi & Otorisasi Awal)) Tj\n/F2 10 Tf\n0 -18 Td\n(- Validasi seluruh input request: tipe data, format, keunikan, dan keberadaan di database.) Tj\n0 -16 Td\n(- Otorisasi dasar sebelum masuk controller: tolak request bila user tidak berhak.) Tj\n/F1 12 Tf\n0 -28 Td\n(Layer B: Thin Controller (HTTP In/Out Orkestrasi)) Tj\n/F2 10 Tf\n0 -18 Td\n(- Controller HANYA menerima data dari FormRequest, memanggil Service, dan mereturn Response.) Tj\n0 -16 Td\n(- DILARANG menulis query SQL, kalkulasi skor, atau mutasi data multi-tabel di controller.) Tj\n/F1 12 Tf\n0 -28 Td\n(Layer C: Domain Service (Pusat Business Logic)) Tj\n/F2 10 Tf\n0 -18 Td\n(- Tempat seluruh kalkulasi bisnis berada: progress, passing grade, penentuan kelulusan.) Tj\n0 -16 Td\n(- Mengenkapsulasi database transaction: DB::transaction(function() { ... }).) Tj\n0 -16 Td\n(- Menjamin integritas data: rollback otomatis apabila terjadi kegagalan sistem di tengah proses.) Tj\n/F2 9 Tf\n0 -180 Td\n(Halaman 2 dari 3 - Lanjutkan membaca ke Halaman 3 untuk checklist penyelesaian materi) Tj\nET\nendstream\nendobj\n8 0 obj\n<< /Length 1195 >>\nstream\nBT\n/F1 16 Tf\n50 740 Td\n(3. Best Practices Database & Checklist Penyelesaian) Tj\n/F1 12 Tf\n0 -28 Td\n(A. Optimasi Eloquent & PostgreSQL) Tj\n/F2 10 Tf\n0 -18 Td\n(- Cegah N+1 query problem dengan eager loading: Course::with([\"modules.materials\", \"instructors\"]).) Tj\n0 -16 Td\n(- Pastikan indeks foreign key terpasang pada user_id, course_id, module_id untuk performa tinggi.) Tj\n0 -16 Td\n(- Gunakan server-side pagination untuk membatasi ukuran memori HTTP response.) Tj\n/F1 12 Tf\n0 -28 Td\n(B. Rekalkulasi Progres dan Course Completion) Tj\n/F2 10 Tf\n0 -18 Td\n(- Progres dihitung berdasarkan materi mandatory yang terselesaikan: CourseCompletionService.) Tj\n0 -16 Td\n(- Status kursus menjadi COMPLETED hanya bila SELURUH aktivitas wajib telah lulus dan selesai.) Tj\n/F1 12 Tf\n0 -28 Td\n(C. Verifikasi Penyelesaian Materi) Tj\n/F2 10 Tf\n0 -18 Td\n(Selamat! Anda telah mempelajari seluruh dokumen panduan ini dari Halaman 1 hingga Halaman 3.) Tj\n0 -16 Td\n(Penyelesaian materi ini akan otomatis tercatat ke server ELMS setelah Anda mencapai halaman akhir ini.) Tj\n0 -16 Td\n(Silakan lanjutkan ke materi atau evaluasi kuis berikutnya di kurikulum kursus Anda.) Tj\n/F1 10 Tf\n0 -40 Td\n(=== AKHIR DOKUMEN MATERI PEMBELAJARAN ===) Tj\n/F2 9 Tf\n0 -150 Td\n(Halaman 3 dari 3 - Dokumen Lengkap Terverifikasi) Tj\nET\nendstream\nendobj\n9 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n10 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 11\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000127 00000 n \n0000000267 00000 n \n0000000407 00000 n \n0000000547 00000 n \n0000001683 00000 n \n0000002951 00000 n \n0000004200 00000 n \n0000004285 00000 n \ntrailer\n<< /Size 11 /Root 1 0 R >>\nstartxref\n4365\n%%EOF";
            Storage::disk('local')->put('materials/modular-monolith-guide.pdf', $stream);
        }

        $mod2 = Module::query()->updateOrCreate(
            ['course_id' => $course1->id, 'sort_order' => 2],
            ['title' => 'Database Transactions & Concurrency', 'description' => 'Pengamanan integritas data menggunakan ACID transaction dan locking.']
        );

        Material::query()->updateOrCreate(
            ['module_id' => $mod2->id, 'sort_order' => 1],
            [
                'title' => 'Implementasi PostgreSQL Advisory Locks',
                'type' => Material::TYPE_VIDEO,
                'video_url' => 'https://example.com/videos/advisory-locks',
                'is_mandatory' => true,
            ]
        );

        Material::query()->updateOrCreate(
            ['module_id' => $mod2->id, 'sort_order' => 2],
            [
                'title' => 'Dokumentasi Tambahan REST API Best Practices',
                'type' => Material::TYPE_TEXT,
                'content' => 'Referensi standar response codes, validation envelopes, dan idempotent endpoints.',
                'is_mandatory' => false,
            ]
        );

        // 2. Course: Dasar-Dasar Keamanan Siber ASN
        $course2 = Course::query()->updateOrCreate(
            ['slug' => 'dasar-dasar-keamanan-siber-asn'],
            [
                'category_id' => $catSec->id,
                'title' => 'Dasar-Dasar Keamanan Siber ASN',
                'description' => 'Pelatihan kesadaran keamanan informasi, perlindungan akun, dan penanganan ancaman rekayasa sosial.',
                'estimated_duration' => 120,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course2->instructors()->syncWithoutDetaching([$instructor->id]);

        $modSec1 = Module::query()->updateOrCreate(
            ['course_id' => $course2->id, 'sort_order' => 1],
            ['title' => 'Pengamanan Kredensial & Autentikasi', 'description' => 'Pencegahan credential stuffing dan tata cara password aman.']
        );

        Material::query()->updateOrCreate(
            ['module_id' => $modSec1->id, 'sort_order' => 1],
            [
                'title' => 'Manajemen Password Kuat dan Otentikasi Dua Langkah',
                'type' => Material::TYPE_TEXT,
                'content' => 'Gunakan kombinasi simbol, huruf kapital, angka, serta hindari pemakaian password yang sama lintas aplikasi.',
                'is_mandatory' => true,
            ]
        );

        // 3. Course: Etika Birokrasi & Kepemimpinan Publik
        $course3 = Course::query()->updateOrCreate(
            ['slug' => 'etika-birokrasi-kepemimpinan-publik'],
            [
                'category_id' => $catLead->id,
                'title' => 'Etika Birokrasi & Kepemimpinan Publik',
                'description' => 'Internalisasi nilai dasar ASN BerAKHLAK dan integritas pelayanan.',
                'estimated_duration' => 90,
                'status' => Course::STATUS_PUBLISHED,
            ]
        );
        $course3->instructors()->syncWithoutDetaching([$instructor->id]);

        $modLead1 = Module::query()->updateOrCreate(
            ['course_id' => $course3->id, 'sort_order' => 1],
            ['title' => 'Integritas Pelayanan Publik', 'description' => 'Panduan perilaku dan anti-gratifikasi.']
        );

        Material::query()->updateOrCreate(
            ['module_id' => $modLead1->id, 'sort_order' => 1],
            [
                'title' => 'Penerapan Nilai BerAKHLAK dalam Tugas Sehari-hari',
                'type' => Material::TYPE_TEXT,
                'content' => 'Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, dan Kolaboratif.',
                'is_mandatory' => true,
            ]
        );
    }
}
