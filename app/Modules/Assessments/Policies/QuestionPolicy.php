<?php

namespace App\Modules\Assessments\Policies;

use App\Models\Question;
use App\Models\Quiz;
use App\Models\Role;
use App\Models\User;

class QuestionPolicy
{
    public function create(User $user, Quiz $quiz): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructorForQuiz($user, $quiz);
    }

    public function update(User $user, Question $question): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructorForQuestion($user, $question);
    }

    public function delete(User $user, Question $question): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $user->hasRole(Role::INSTRUCTOR) && $this->isAssignedInstructorForQuestion($user, $question);
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN, Role::LEARNING_ADMIN);
    }

    private function isAssignedInstructorForQuiz(User $user, Quiz $quiz): bool
    {
        $course = $quiz->module?->course;

        return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
    }

    private function isAssignedInstructorForQuestion(User $user, Question $question): bool
    {
        $course = $question->quiz?->module?->course;

        return $course !== null && $course->instructors()->where('users.id', $user->id)->exists();
    }
}
