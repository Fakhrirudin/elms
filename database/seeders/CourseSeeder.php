<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\Material;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Seeder;

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
