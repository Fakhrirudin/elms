<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->after('id')->constrained('roles')->restrictOnDelete();
            $table->foreignId('department_id')->nullable()->after('role_id')->constrained('departments')->restrictOnDelete();
            $table->string('employee_number', 50)->nullable()->unique()->after('name');
            $table->boolean('is_active')->default(true)->after('password');

            $table->index('role_id');
            $table->index('department_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['department_id']);
            $table->dropIndex(['role_id']);
            $table->dropIndex(['department_id']);
            $table->dropIndex(['is_active']);
            $table->dropUnique(['employee_number']);
            $table->dropColumn(['role_id', 'department_id', 'employee_number', 'is_active']);
        });
    }
};
