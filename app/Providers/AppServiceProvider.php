<?php

namespace App\Providers;

use App\Models\Department;
use App\Models\Notification;
use App\Modules\Notifications\Policies\NotificationPolicy;
use App\Modules\Reports\Policies\ReportPolicy;
use App\Modules\Users\Policies\DepartmentPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url', 'http://localhost:8000')), '/');
            $email = method_exists($notifiable, 'getEmailForPasswordReset')
                ? $notifiable->getEmailForPasswordReset()
                : ($notifiable->email ?? '');

            return "{$frontendUrl}/reset-password?token={$token}&email=".urlencode($email);
        });

        Gate::define('viewDashboard', [ReportPolicy::class, 'viewDashboard']);
        Gate::define('viewCourseReport', [ReportPolicy::class, 'viewCourseReport']);
        Gate::define('viewLearningReport', [ReportPolicy::class, 'viewLearningReport']);
        Gate::define('viewQuizReport', [ReportPolicy::class, 'viewQuizReport']);

        Gate::policy(Notification::class, NotificationPolicy::class);
        Gate::policy(Department::class, DepartmentPolicy::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
