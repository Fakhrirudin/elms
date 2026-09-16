<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Option;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Database\Seeder;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        $course1 = Course::where('slug', 'arsitektur-web-enterprise-modern')->firstOrFail();
        $mod2 = $course1->modules()->where('sort_order', 2)->firstOrFail();

        $quiz1 = Quiz::query()->updateOrCreate(
            ['module_id' => $mod2->id, 'title' => 'Evaluasi Arsitektur & Transaksi Web'],
            [
                'description' => 'Uji pemahaman terkait Modular Monolith, Service Layer, dan integritas transaksi database.',
                'passing_grade' => 70.0,
                'max_attempts' => 3,
                'status' => Quiz::STATUS_PUBLISHED,
            ]
        );

        // Q1
        $q1 = Question::query()->updateOrCreate(
            ['quiz_id' => $quiz1->id, 'question' => 'Manakah pernyataan yang paling tepat mengenai Modular Monolith?'],
            ['sort_order' => 1]
        );

        $q1Options = [
            ['option_text' => 'Seluruh kode disatukan dalam satu folder tanpa batasan modul.', 'is_correct' => false],
            ['option_text' => 'Aplikasi monolitik yang dibagi ke dalam modul-modul independen berdasarkan boundary domain bisnis.', 'is_correct' => true],
            ['option_text' => 'Aplikasi yang wajib dipisah menjadi puluhan microservices terpisah jaringan.', 'is_correct' => false],
            ['option_text' => 'Pola di mana controller menangani seluruh query SQL langsung.', 'is_correct' => false],
        ];

        foreach ($q1Options as $idx => $opt) {
            Option::query()->updateOrCreate(
                ['question_id' => $q1->id, 'option_text' => $opt['option_text']],
                ['is_correct' => $opt['is_correct'], 'sort_order' => $idx + 1]
            );
        }

        // Q2
        $q2 = Question::query()->updateOrCreate(
            ['quiz_id' => $quiz1->id, 'question' => 'Mengapa PostgreSQL Transactional Advisory Lock digunakan pada penomoran sertifikat?'],
            ['sort_order' => 2]
        );

        $q2Options = [
            ['option_text' => 'Untuk mempercepat response cache browser.', 'is_correct' => false],
            ['option_text' => 'Untuk mencegah race condition dan duplikasi sequence nomor sertifikat pada transaksi konkuren.', 'is_correct' => true],
            ['option_text' => 'Agar sertifikat tidak perlu disimpan pada media database.', 'is_correct' => false],
            ['option_text' => 'Sebagai pengganti algoritma enkripsi password.', 'is_correct' => false],
        ];

        foreach ($q2Options as $idx => $opt) {
            Option::query()->updateOrCreate(
                ['question_id' => $q2->id, 'option_text' => $opt['option_text']],
                ['is_correct' => $opt['is_correct'], 'sort_order' => $idx + 1]
            );
        }

        // Course 2 Quiz
        $course2 = Course::where('slug', 'dasar-dasar-keamanan-siber-asn')->firstOrFail();
        $modSec = $course2->modules()->firstOrFail();

        $quiz2 = Quiz::query()->updateOrCreate(
            ['module_id' => $modSec->id, 'title' => 'Kuis Kesadaran Keamanan Informasi ASN'],
            [
                'description' => 'Evaluasi kewaspadaan terhadap ancaman rekayasa sosial dan keamanan akun.',
                'passing_grade' => 70.0,
                'max_attempts' => 3,
                'status' => Quiz::STATUS_PUBLISHED,
            ]
        );

        $qSec1 = Question::query()->updateOrCreate(
            ['quiz_id' => $quiz2->id, 'question' => 'Tindakan apa yang harus dilakukan jika menerima email mencurigakan yang meminta reset password akun kedinasan?'],
            ['sort_order' => 1]
        );

        $qSec1Options = [
            ['option_text' => 'Langsung klik tautan dan masukkan password lama.', 'is_correct' => false],
            ['option_text' => 'Verifikasi keabsahan pengirim dan laporkan ke Unit TI / CSIRT instansi.', 'is_correct' => true],
            ['option_text' => 'Forward email tersebut ke seluruh staf kantor.', 'is_correct' => false],
            ['option_text' => 'Balas email dengan nomor WhatsApp pribadi.', 'is_correct' => false],
        ];

        foreach ($qSec1Options as $idx => $opt) {
            Option::query()->updateOrCreate(
                ['question_id' => $qSec1->id, 'option_text' => $opt['option_text']],
                ['is_correct' => $opt['is_correct'], 'sort_order' => $idx + 1]
            );
        }
    }
}
