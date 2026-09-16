<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Software Engineering & Architecture',
                'slug' => 'software-engineering',
                'description' => 'Prinsip desain perangkat lunak modern, Clean Architecture, dan REST API.',
            ],
            [
                'name' => 'Keamanan Informasi & Siber',
                'slug' => 'cyber-security',
                'description' => 'Standar keamanan data, mitigasi celah OWASP, dan perlindungan privasi.',
            ],
            [
                'name' => 'Hubungan Internasional & Diplomasi',
                'slug' => 'international-relations',
                'description' => 'Protokol diplomatik, negosiasi bilateral, dan tata kelola global.',
            ],
            [
                'name' => 'Kepemimpinan & Manajemen ASN',
                'slug' => 'leadership-management',
                'description' => 'Integritas aparatur, kepemimpinan adaptif, dan pelayanan publik prima.',
            ],
        ];

        foreach ($categories as $cat) {
            Category::query()->updateOrCreate(
                ['slug' => $cat['slug']],
                $cat
            );
        }
    }
}
