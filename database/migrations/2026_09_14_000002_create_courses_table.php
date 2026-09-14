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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('title', 200);
            $table->string('slug', 220);
            $table->text('description')->nullable();
            $table->string('thumbnail', 255)->nullable();
            $table->integer('estimated_duration')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique('slug');
            $table->index('category_id');
            $table->index('status');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
