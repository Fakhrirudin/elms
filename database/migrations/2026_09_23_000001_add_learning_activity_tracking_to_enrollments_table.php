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
        Schema::table('enrollments', function (Blueprint $table) {
            $table->string('last_activity_type', 20)->nullable()->after('completed_at');
            $table->unsignedBigInteger('last_activity_id')->nullable()->after('last_activity_type');
            $table->timestamp('last_accessed_at')->nullable()->after('last_activity_id');

            $table->index(['last_activity_type', 'last_activity_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex(['last_activity_type', 'last_activity_id']);
            $table->dropColumn(['last_activity_type', 'last_activity_id', 'last_accessed_at']);
        });
    }
};
