<?php

namespace App\Services;

use App\Models\QuizMatch;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameStateService
{
    protected $ablyService;
    protected $achievementService;

    public function __construct(AblyService $ablyService, AchievementService $achievementService)
    {
        $this->ablyService = $ablyService;
        $this->achievementService = $achievementService;
    }

    public function startGame(QuizMatch $match)
    {
        Log::info("GameStateService: startGame for Match {$match->id}");
        // 1. Select 5 random questions
        // Ideally we pick based on user preference or random
        $questions = Question::inRandomOrder()->limit(5)->get();
        Log::info("Selected " . $questions->count() . " questions.");
        
        if ($questions->isEmpty()) {
            Log::error("No questions found in database!");
            return;
        }

        $questionIds = $questions->pluck('id')->toArray();

        // 2. Initialize Match State
        $match->update([
            'status' => 'active',
            'current_question_index' => 0,
            'questions_sequence' => $questionIds,
            'player_scores' => [
                'p1' => 0, 
                'p2' => 0
            ],
            'last_question_at' => now(), // Initialize
        ]);

        // 3. Publish Game Start Event
        $this->ablyService->publish(
            "match:{$match->channel_id}",
            'match:start',
            [
                'match_id' => $match->id,
                'total_questions' => 5,
                'start_time' => now()->timestamp,
                'players' => [
                    'p1' => $match->player1,
                    'p2' => $match->player2
                ]
            ]
        );

        // 4. Send First Question (with longer delay for page load)
        Log::info("Sending first question...");
        $this->sendQuestion($match, $questions->first(), 0, 3);
    }

    public function sendQuestion(QuizMatch $match, Question $question, int $index, int $delay = 3)
    {
        // Update timestamp for scoring verification and reset answers
        $match->update([
            'last_question_at' => now(),
            'round_answers' => [] 
        ]);

        // We strip the correct answer for security
        $payload = [
            'question_id' => $question->id,
            'text' => $question->question_text,
            'options' => $question->options, // assumed JSON/array
            'text_my' => $question->question_text_my,
            'options_my' => $question->options_my,
            'category' => $question->category,
            'round_index' => $index + 1,
            'total_rounds' => 5,
            'time_limit' => 15,
            'sent_at' => now()->timestamp,
            'start_at' => now()->addSeconds($delay)->timestamp
        ];

        $this->ablyService->publish(
            "match:{$match->channel_id}",
            'game:question',
            $payload
        );
    }

    public function submitAnswer($matchId, $userId, $questionId, $answer)
    {
        return DB::transaction(function () use ($matchId, $userId, $questionId, $answer) {
            $match = QuizMatch::lockForUpdate()->find($matchId);
            
            if (!$match) return ['error' => 'Match not found'];
            
            if ($match->player1_id != $userId && $match->player2_id != $userId) {
                return ['error' => 'Not a player in this match'];
            }
    
            $question = Question::find($questionId);
            if (!$question) return ['error' => 'Question not found'];
            
            // Prevent double answering
            $answers = $match->round_answers ?? [];
            $playerKey = ($userId == $match->player1_id) ? 'p1' : 'p2';
            
            if (isset($answers[$playerKey])) {
                return ['error' => 'Already answered'];
            }
    
            $isCorrect = $question->correct_answer === $answer;
            $points = 0;
    
            if ($isCorrect) {
                 // Server calc: Time since question sent
                 $sentAt = $match->last_question_at;
                 $now = now();
                 
                 // Determine start time based on rounds
                 // Logic must match sendQuestion delays
                 // Round 1 = 6s, Others = 3s
                 $delay = ($match->current_question_index == 0) ? 6 : 3;
                 
                 $startAt = $sentAt ? $sentAt->copy()->addSeconds($delay) : now();
                 
                 // If answered BEFORE startAt (impossible via UI but possible via API), points might be weird?
                 // Let's assume answered after startAt.
                 
                 $diffInSeconds = $now->diffInSeconds($startAt);
                 
                 // If before start, invalid? Or just max points?
                 // Let's rely on diff. If now > startAt, positive.
                 // Actually diffInSeconds is absolute.
                 
                 if ($now->lessThan($startAt)) {
                     // Answered too early (cheat?)
                     $timeTaken = 0;
                 } else {
                     $timeTaken = $startAt->diffInSeconds($now);
                 }

                 $timeRemaining = max(15 - $timeTaken, 0);
                
                // Base 50 + Time Bonus (Match Score)
                $points = 50 + (int) round($timeRemaining * 10);

                // Give Global Points immediately for correct answer
                User::where('id', $userId)->increment('points', 15);
            }
    
            // Update Score State in memory
            $scores = $match->player_scores ?? ['p1' => 0, 'p2' => 0];
            $scores[$playerKey] += $points;
            
            // Update Answers
            $answers[$playerKey] = $answer;
    
            $match->update([
                'player_scores' => $scores,
                'round_answers' => $answers,
                // Ensure we don't wipe rematch flags if any (though usually cleared on start)
            ]);
    
            $this->ablyService->publish(
                "match:{$match->channel_id}",
                'game:answered',
                ['clientId' => (string)$userId]
            );
            
            // Check if both answered (Atomic check inside transaction)
            if (count($answers) >= 2) {
                Log::info("Both players answered match {$match->id}. Concluding round.");
                $this->concludeRound($match);
            } else {
                Log::info("Player {$playerKey} answered match {$match->id}. Waiting for opponent. Count: " . count($answers));
            }
    
            return [
                'correct' => $isCorrect,
                'points' => $points,
                'new_score' => $scores[$playerKey],
                'answers_count' => count($answers)
            ];
        });
    }
    
    public function getCurrentState($matchId)
    {
        $match = QuizMatch::findOrFail($matchId);
        
        // Construct state object for frontend recovery
        $currentQId = $match->questions_sequence[$match->current_question_index] ?? null;
        $currentQuestion = null;
        
        if ($currentQId) {
             $q = Question::find($currentQId);
             if ($q) {
                 // Determine delay based on round index
                 $delay = ($match->current_question_index == 0) ? 6 : 3;
                 $sentAt = $match->last_question_at ? $match->last_question_at->timestamp : now()->timestamp;
                 $startAt = $match->last_question_at ? $match->last_question_at->addSeconds($delay)->timestamp : now()->addSeconds($delay)->timestamp;

                 $currentQuestion = [
                    'question_id' => $q->id,
                    'text' => $q->question_text,
                    'options' => $q->options,
                    'text_my' => $q->question_text_my,
                    'options_my' => $q->options_my,
                    'category' => $q->category,
                    'round_index' => $match->current_question_index + 1,
                    'total_rounds' => 5,
                    'time_limit' => 15,
                    'sent_at' => $sentAt,
                    'start_at' => $startAt
                 ];
             }
        }

        return [
            'status' => $match->status, // 'active', 'completed', etc.
            'currentQuestion' => $currentQuestion,
            'playerScores' => $match->player_scores,
            'timer_start' => $match->last_question_at ? $match->last_question_at->timestamp : null
        ];
    }
    
    // Call this when both answered
    public function concludeRound(QuizMatch $match)
    {
         $currentIndex = $match->current_question_index;
         $sequence = $match->questions_sequence;
         
         // Get current question to reveal answer
         $currentQId = $sequence[$currentIndex] ?? null;
         $correctAnswer = null;
         if ($currentQId) {
             $q = Question::find($currentQId);
             $correctAnswer = $q ? $q->correct_answer : null;
         }

         $this->ablyService->publish(
             "match:{$match->channel_id}",
             'game:round_result',
             [
                 'correct_option' => $correctAnswer,
                 'player_scores' => $match->player_scores,
                 'round_index' => $currentIndex + 1
             ]
         );
    }
    
    // Call this to move to next question
    public function triggerNextQuestion(QuizMatch $match)
    {
         $currentIndex = $match->current_question_index;
         $sequence = $match->questions_sequence;
         
         if ($currentIndex + 1 >= count($sequence)) {
             $this->endGame($match);
         } else {
             $match->increment('current_question_index');
             // Send next question
             $this->sendQuestion($match, Question::find($sequence[$currentIndex + 1]), $currentIndex + 1);
         }
    }

    public function endGame(QuizMatch $match)
    {
        $scores = $match->player_scores;
        $p1Score = $scores['p1'];
        $p2Score = $scores['p2'];

        $winnerId = null;
        if ($p1Score > $p2Score) $winnerId = $match->player1_id;
        elseif ($p2Score > $p1Score) $winnerId = $match->player2_id;

        $match->update([
            'status' => 'completed',
            'winner_id' => $winnerId
        ]);
        
        // Update User stats
        if ($winnerId) {
            User::where('id', $winnerId)->increment('points', 30); // Win Bonus
            User::where('id', $winnerId)->increment('wins', 1);
            
            // Check Achievements
            $winner = User::find($winnerId);
            $this->achievementService->checkAchievements($winner, 'wins', $winner->wins);
            
            $loserId = ($winnerId == $match->player1_id) ? $match->player2_id : $match->player1_id;
            if ($loserId) {
                // No penalty, just no win bonus. They kept their answer points.
                // Or maybe small penalty to enforce risk?
                // Let's remove penalty to be friendlier, or keep small one.
                // User said "distribution wrong", penalties feel wrong.
                // I will REMOVE penalty.
                User::where('id', $loserId)->increment('losses', 1);
            }
        } else {
            // TIE
             User::where('id', $match->player1_id)->increment('points', 10);
             User::where('id', $match->player2_id)->increment('points', 10);
        }

        $this->ablyService->publish(
            "match:{$match->channel_id}",
            'game:over',
            [
                'winner_id' => $winnerId,
                'final_scores' => $scores
            ]
        );
    }

    public function requestRematch($matchId, $userId)
    {
        $match = QuizMatch::findOrFail($matchId);
        
        // Use Redis Set to store who requested
        // Key: quiz_matches:{id}:rematch_requests
        $key = "quiz_matches:{$matchId}:rematch_requests";
        
        \Illuminate\Support\Facades\Redis::sadd($key, $userId);
        \Illuminate\Support\Facades\Redis::expire($key, 300); // 5 mins expiry
        
        // Notify other player
        $this->ablyService->publish(
            "match:{$match->channel_id}",
            'match:rematch_requested',
            ['requested_by' => $userId]
        );
        
        // Check if we have 2 requests
        $count = \Illuminate\Support\Facades\Redis::scard($key);
        
        if ($count >= 2) {
             $this->initiateRematch($match);
        }
    }
    
    protected function initiateRematch(QuizMatch $oldMatch)
    {
        // Swap players or keep same? Usually keep same but reset.
        // Or create NEW match record
        
        $newMatch = QuizMatch::create([
            'player1_id' => $oldMatch->player1_id,
            'player2_id' => $oldMatch->player2_id,
            'status' => 'pending', 
            'channel_id' => \Illuminate\Support\Str::uuid(),
            'current_question_index' => 0,
            'player_scores' => ['p1' => 0, 'p2' => 0],
        ]);
        
        // Clear Redis key
        \Illuminate\Support\Facades\Redis::del("quiz_matches:{$oldMatch->id}:rematch_requests");
        
        // Broadcast Ready
        $this->ablyService->publish(
            "match:{$oldMatch->channel_id}",
            'match:rematch_ready',
            [
                'new_match_id' => $newMatch->id,
                'channel_id' => $newMatch->channel_id
            ]
        );
        
        // Start the new game immediately? 
        // Or wait for them to join 'active'?
        // GameController usually handles start. 
        // But since both are "in", we can auto-start or let them join.
        // The frontend will redirect to /arena/{id}.
        // The Arena component will load. 
        // P1 is host. P1 will trigger "match:start"?? 
        // Wait, normally `findMatch` -> `MatchmakingService` -> creates active match.
        // Here we created 'pending'.
        // We should probably set it to 'active' immediately since both are conceptually 'joined'.
        
        $newMatch->status = 'active';
        $newMatch->save();
        
        // But we need to run 'startGame' logic (select questions etc).
        // Let's call startGame here to prep it.
        $this->startGame($newMatch);
    }
}
