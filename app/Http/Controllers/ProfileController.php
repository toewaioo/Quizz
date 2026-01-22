<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request)
    {
        $user = $request->user();
        
        $history = \App\Models\QuizMatch::where('player1_id', $user->id)
            ->orWhere('player2_id', $user->id)
            ->with(['player1', 'player2', 'winner'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($match) use ($user) {
                $isPlayer1 = $match->player1_id === $user->id;
                $opponent = $isPlayer1 ? $match->player2 : $match->player1;
                
                return [
                    'id' => $match->id,
                    'opponent' => $opponent ? [
                        'name' => $opponent->name,
                        'avatar' => $opponent->profile_photo_url,
                    ] : null,
                    'result' => $match->winner_id === $user->id ? 'win' : ($match->winner_id ? 'loss' : 'draw'), // or pending
                    'date' => $match->created_at->diffForHumans(),
                    'score' => $match->player_scores ? 
                        ($isPlayer1 
                            ? ($match->player_scores['p1'] ?? 0) . ' - ' . ($match->player_scores['p2'] ?? 0)
                            : ($match->player_scores['p2'] ?? 0) . ' - ' . ($match->player_scores['p1'] ?? 0)
                        ) : '0 - 0',
                ];
            });

        return Inertia::render('Profile/Show', [
            'status' => session('status'),
            'history' => $history,
            'stats' => [
                'total_games' => $user->wins + $user->losses, // Approximate if we don't track draws separately yet
                'wins' => $user->wins,
                'losses' => $user->losses,
                'points' => $user->points,
            ]
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'nullable|array',
            'settings.difficulty' => 'nullable|string|in:easy,medium,hard',
            'photo' => 'nullable|image|max:2048', // Validate as image
            'username' => 'nullable|string|max:255|unique:users,username,' . $request->user()->id,
        ]);

        $user = $request->user();
        
        if ($request->has('username')) {
            $user->username = $request->input('username');
        }

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = 'avatars/' . $file->hashName();
            $result = app(\App\Services\SupabaseStorage::class)->uploadFile($filename, file_get_contents($file->getPathname()), $file->getMimeType());
            
            if ($result['success']) {
                $user->profile_photo_path = $result['url'];
            } else {
                // Log failure or handle error
                \Illuminate\Support\Facades\Log::error('Failed to store profile photo to Supabase: ' . ($result['message'] ?? 'Unknown error'));
            }
        }

        if ($request->has('settings')) {
            $settings = $user->settings ?? [];
            $settings = array_merge($settings, $request->input('settings'));
            $user->settings = $settings;
        }

        $user->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Display the user's public profile.
     */
    public function show($identifier)
    {
        $user = \App\Models\User::where('username', $identifier)->first();

        if (!$user && is_numeric($identifier)) {
            $user = \App\Models\User::find($identifier);
        }

        if (!$user) {
            abort(404);
        }

        // Fetch History
        $history = \App\Models\QuizMatch::where('player1_id', $user->id)
            ->orWhere('player2_id', $user->id)
            ->with(['player1', 'player2', 'winner'])
            ->where('status', 'completed') // Only completed matches
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($match) use ($user) {
                $isPlayer1 = $match->player1_id === $user->id;
                $opponent = $isPlayer1 ? $match->player2 : $match->player1;
                
                return [
                    'id' => $match->id,
                    'opponent' => $opponent ? [
                        'name' => $opponent->name,
                        'avatar' => $opponent->profile_photo_url,
                        'username' => $opponent->username,
                    ] : null,
                    'result' => $match->winner_id === $user->id ? 'win' : ($match->winner_id ? 'loss' : 'draw'),
                    'date' => $match->created_at->diffForHumans(),
                ];
            });

        // Calculate Level and Rank (Leaderboard Position)
        $level = floor($user->points / 100) + 1;
        $rank = \App\Models\User::where('points', '>', $user->points)->count() + 1;
        
        // Tier Title (for visual flair)
        $tierTitle = match (true) {
            $user->points >= 1000 => 'Grandmaster',
            $user->points >= 500 => 'Master',
            $user->points >= 200 => 'Diamond',
            $user->points >= 100 => 'Gold',
            $user->points >= 50 => 'Silver',
            default => 'Bronze',
        };

        // Fetch Achievements
        $achievements = $user->achievements()
            ->select('achievements.*', 'user_achievements.unlocked_at')
            ->orderBy('user_achievements.unlocked_at', 'desc')
            ->get()
            ->map(function ($achievement) {
                return [
                    'id' => $achievement->id,
                    'name' => $achievement->name,
                    'description' => $achievement->description,
                    'icon' => $achievement->icon,
                    'unlocked_at' => \Carbon\Carbon::parse($achievement->pivot->unlocked_at)->diffForHumans(),
                ];
            });

        return Inertia::render('Profile/Public', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'profile_photo_url' => $user->profile_photo_url,
                'points' => $user->points,
                'wins' => $user->wins,
                'losses' => $user->losses,
                'created_at' => $user->created_at->format('M Y'),
                'level' => $level,
                'rank' => $rank,
                'rank_title' => $tierTitle,
            ],
            'history' => $history,
            'achievements' => $achievements,
        ])->withViewData([
            'meta' => [
                'title' => "{$user->name}'s Profile | Quizz",
                'description' => "Check out {$user->name} on Quizz! Level {$level} {$tierTitle}. Wins: {$user->wins}, Points: {$user->points}.",
                'image' => $user->profile_photo_url,
            ]
        ]);
    }
}
