import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import CourseCatalogPage from '@/features/courses/pages/CourseCatalogPage';
import CourseDetailPage from '@/features/courses/pages/CourseDetailPage';
import CourseManagementPage from '@/features/courses/pages/authoring/CourseManagementPage';
import CourseCreatePage from '@/features/courses/pages/authoring/CourseCreatePage';
import CourseEditPage from '@/features/courses/pages/authoring/CourseEditPage';
import MyLearningPage from '@/features/learning/pages/MyLearningPage';
import LearningPlayerPage from '@/features/learning/pages/LearningPlayerPage';
import QuizPage from '@/features/assessments/pages/QuizPage';
import AssignmentPlayerPage from '@/features/assessments/pages/AssignmentPlayerPage';
import MyCertificatesPage from '@/features/certificates/pages/MyCertificatesPage';
import CertificateDetailPage from '@/features/certificates/pages/CertificateDetailPage';
import ReportsIndexPage from '@/features/reports/pages/ReportsIndexPage';
import CourseReportPage from '@/features/reports/pages/CourseReportPage';
import LearningReportPage from '@/features/reports/pages/LearningReportPage';
import QuizReportPage from '@/features/reports/pages/QuizReportPage';
import NotFoundPage from './NotFoundPage';

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public/Guest Routes */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Protected Routes inside AppLayout */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/courses" element={<CourseCatalogPage />} />
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                    <Route path="/admin/courses" element={<CourseManagementPage />} />
                    <Route path="/admin/courses/create" element={<CourseCreatePage />} />
                    <Route path="/admin/courses/:courseId/edit" element={<CourseEditPage />} />
                    <Route path="/my-learning" element={<MyLearningPage />} />
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                    <Route path="/my-learning/:enrollmentId/quizzes/:quizId" element={<QuizPage />} />
                    <Route path="/my-learning/:enrollmentId/assignments/:assignmentId" element={<AssignmentPlayerPage />} />
                    <Route path="/certificates" element={<MyCertificatesPage />} />
                    <Route path="/certificates/:certificateId" element={<CertificateDetailPage />} />
                    <Route path="/reports" element={<ReportsIndexPage />} />
                    <Route path="/reports/courses" element={<CourseReportPage />} />
                    <Route path="/reports/learning" element={<LearningReportPage />} />
                    <Route path="/reports/quiz" element={<QuizReportPage />} />
                </Route>
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRoutes;
