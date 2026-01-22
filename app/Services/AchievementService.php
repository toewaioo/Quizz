<?php

namespace App\Services;

use App\Models\User;
use App\Models\Achievement;
use Illuminate\Support\Facades\Log;

class AchievementService
{
    /**
     * Check if a user has unlocked any achievements based on a trigger.
     *
     * @param User $user
     * @param string $type The condition type (e.g., 'wins', 'points')
     * @param int $currentValue The current value of the metric
     */
    public function checkAchievements(User $user, string $type, int $currentValue)
    {
        // Find achievements of this type that the user has NOT yet unlocked
        // and where the condition value is met
        $candidates = Achievement::where('condition_type', $type)
            ->where('condition_value', '<=', $currentValue)
            ->whereDoesntHave('users', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get();

        foreach ($candidates as $achievement) {
            $this->unlock($user, $achievement);
        }
    }

    /**
     * Unlock a specific achievement for a user.
     */
    public function unlock(User $user, Achievement $achievement)
    {
        Log::info("Unlocking achievement '{$achievement->name}' for user {$user->id}");

        $user->achievements()->attach($achievement->id, [
            'unlocked_at' => now(),
        ]);
        
        // TODO: In the future, we could publish a real-time notification via Ably here
        // so the frontend can show a popup toast.
    }
}
