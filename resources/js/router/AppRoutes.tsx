import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/features/auth/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CourseCatalogPage from '@/features/courses/pages/CourseCatalogPage';
import CourseDetailPage from '@/features/courses/pages/CourseDetailPage';
import MyLearningPage from '@/features/learning/pages/MyLearningPage';
import LearningPlayerPage from '@/features/learning/pages/LearningPlayerPage';
import QuizPage from '@/features/assessments/pages/QuizPage';
import MyCertificatesPage from '@/features/certificates/pages/MyCertificatesPage';
import CertificateDetailPage from '@/features/certificates/pages/CertificateDetailPage';
import NotFoundPage from './NotFoundPage';

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public/Guest Routes */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected Routes inside AppLayout */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/courses" element={<CourseCatalogPage />} />
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                    <Route path="/my-learning" element={<MyLearningPage />} />
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                    <Route path="/my-learning/:enrollmentId/quizzes/:quizId" element={<QuizPage />} />
                    <Route path="/certificates" element={<MyCertificatesPage />} />
                    <Route path="/certificates/:certificateId" element={<CertificateDetailPage />} />
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
