<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // first_win, 10_wins
            $table->string('name');
            $table->string('description');
            $table->string('icon'); // Lucide icon name
            $table->string('condition_type'); // wins, points, etc.
            $table->integer('condition_value');
            $table->timestamps();
        });

        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('achievement_id')->constrained()->onDelete('cascade');
            $table->timestamp('unlocked_at');
            $table->timestamps();
            
            $table->unique(['user_id', 'achievement_id']);
        });

        // Seed initial achievements
        DB::table('achievements')->insert([
            [
                'key' => 'first_win',
                'name' => 'First Blood',
                'description' => 'Win your first match.',
                'icon' => 'Sword',
                'condition_type' => 'wins',
                'condition_value' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'warm_up',
                'name' => 'Warming Up',
                'description' => 'Win 5 matches.',
                'icon' => 'Flame',
                'condition_type' => 'wins',
                'condition_value' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'veteran',
                'name' => 'Veteran',
                'description' => 'Win 10 matches.',
                'icon' => 'Medal',
                'condition_type' => 'wins',
                'condition_value' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'champion',
                'name' => 'Champion',
                'description' => 'Win 50 matches.',
                'icon' => 'Crown',
                'condition_type' => 'wins',
                'condition_value' => 50,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'legend',
                'name' => 'Living Legend',
                'description' => 'Win 100 matches.',
                'icon' => 'Sparkles',
                'condition_type' => 'wins',
                'condition_value' => 100,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_achievements');
        Schema::dropIfExists('achievements');
    }
};
