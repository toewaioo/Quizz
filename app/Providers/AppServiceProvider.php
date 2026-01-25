<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\SupabaseStorage::class, function ($app) {
            return new \App\Services\SupabaseStorage(
                config('services.supabase.url'),
                config('services.supabase.key'),
                config('services.supabase.bucket')
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
        Vite::prefetch(concurrency: 3);
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // \Illuminate\Validation\Rules\Password::defaults(function () {
        //     return \Illuminate\Validation\Rules\Password::min(8)
        //         ->mixedCase()
        //         ->numbers()
        //         ->symbols()
        //         ->uncompromised();
        // });
    }
}
