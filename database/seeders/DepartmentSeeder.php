<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $pusTIK = Department::query()->updateOrCreate(
            ['name' => 'Pusat Teknologi Informasi dan Komunikasi'],
            [
                'description' => 'Pengelolaan infrastruktur TI dan pengembangan sistem informasi.',
                'parent_id' => null,
            ]
        );

        Department::query()->updateOrCreate(
            ['name' => 'Subbag Pengembangan Aplikasi'],
            [
                'description' => 'Unit rekayasa perangkat lunak dan arsitektur aplikasi.',
                'parent_id' => $pusTIK->id,
            ]
        );

        $biroSDM = Department::query()->updateOrCreate(
            ['name' => 'Biro Sumber Daya Manusia'],
            [
                'description' => 'Pengelolaan kepegawaian dan manajemen talenta.',
                'parent_id' => null,
            ]
        );

        Department::query()->updateOrCreate(
            ['name' => 'Bagian Pelatihan dan Pengembangan'],
            [
                'description' => 'Unit diklat dan peningkatan kompetensi aparatur.',
                'parent_id' => $biroSDM->id,
            ]
        );

        Department::query()->updateOrCreate(
            ['name' => 'Direktorat Diplomasi Publik'],
            [
                'description' => 'Pengelolaan komunikasi publik dan kerjasama internasional.',
                'parent_id' => null,
            ]
        );

        Department::query()->updateOrCreate(
            ['name' => 'Biro Keuangan'],
            [
                'description' => 'Pengelolaan anggaran, perbendaharaan, dan akuntansi.',
                'parent_id' => null,
            ]
        );
    }
}
