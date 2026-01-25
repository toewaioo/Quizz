<?php

namespace App\Services;

use App\Models\QuizMatch;
use App\Models\User;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MatchmakingService
{
    protected $ablyService;
    protected $gameStateService;

    public function __construct(AblyService $ablyService, GameStateService $gameStateService)
    {
        $this->ablyService = $ablyService;
        $this->gameStateService = $gameStateService;
    }

    /**
     * Find an available match from the Redis queue or create a new one.
     * 
     * @param User $user
     * @return array
     */
    public function findOrCreateMatch(User $user): array
    {
        Log::info("MatchmakingService: User {$user->id} searching for match.");
        $attempts = 0;
        $maxAttempts = 5;

        while ($attempts < $maxAttempts) {
            $attempts++;

            // Score-Based Matching (ELO) with Range Expansion
            $ranges = [100, 300, 1000]; // Points difference allowed
            $foundMatch = null;

            foreach ($ranges as $range) {
                // Ensure points are integer
                $points = (int) ($user->points ?? 0);
                $minScore = $points - $range;
                $maxScore = $points + $range;

                Log::info("Matchmaking: User {$user->id} ($points pts) searching range +/- $range ($minScore - $maxScore)");

                $matches = Redis::zrangebyscore('pending_matches_elo', $minScore, $maxScore, ['limit' => [0, 5]]);

                if (empty($matches)) continue;

                foreach ($matches as $matchId) {
                    // Try to remove atomically
                    if (Redis::zrem('pending_matches_elo', $matchId) > 0) {
                        $pendingMatch = QuizMatch::find($matchId);

                        // 1. Invalid/Deleted
                        if (!$pendingMatch || $pendingMatch->status !== 'pending') {
                            continue;
                        }

                        // 2. Self-Match
                        if ($pendingMatch->player1_id === $user->id) {
                            $pendingMatch->delete();
                            continue;
                        }

                        // 3. Valid - Found it!
                        $foundMatch = $pendingMatch;
                        break 2; // Break both loops
                    }
                }
            }

            if ($foundMatch) {
                $pendingMatch = $foundMatch;

                // Final Stale Check (< 300s)
                if ($pendingMatch->created_at->diffInSeconds(now()) < 300) {
                    // Join This Match
                    Log::info("Matchmaking: Joining valid match {$pendingMatch->id} (P1: {$pendingMatch->player1_id})");
                    $pendingMatch->update([
                        'player2_id' => $user->id,
                        'status' => 'active',
                    ]);

                    $this->ablyService->publish(
                        "match:{$pendingMatch->channel_id}",
                        'match-found',
                        [
                            'match_id' => $pendingMatch->id,
                            'opponent' => $user
                        ]
                    );

                    Log::info("MatchmakingService: Auto-starting Match {$pendingMatch->id}");
                    $this->gameStateService->startGame($pendingMatch);

                    return [
                        'match_id' => $pendingMatch->id,
                        'channel_id' => $pendingMatch->channel_id,
                        'role' => 'player2'
                    ];
                }
            }

            // If we exhausted ranges and found nothing, create new match
            Log::info("MatchmakingService: No match found after range expansion. Creating new.");
            return $this->createMatch($user);
        }

        Log::warning("MatchmakingService: Max attempts reached.");
        // Fallback if max attempts reached
        return $this->createMatch($user);
    }




    public function createMatch(User $user): array
    {
        Log::info("MatchmakingService: Creating new match for User {$user->id}");
        $match = QuizMatch::create([
            'player1_id' => $user->id,
            'status' => 'pending',
            'channel_id' => Str::uuid(),
        ]);

        // Push to Redis Sorted Set (Score = User Points)
        $points = (int) ($user->points ?? 0);
        Redis::zadd('pending_matches_elo', $points, $match->id);
        Log::info("Matchmaking: Created Match {$match->id} for User {$user->id} (Points: $points) and pushed to ELO queue.");

        return [
            'match_id' => $match->id,
            'channel_id' => $match->channel_id,
            'role' => 'player1'
        ];
    }
}
