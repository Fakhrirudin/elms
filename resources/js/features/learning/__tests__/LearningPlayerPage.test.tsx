import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LearningPlayerPage from '../pages/LearningPlayerPage';
import useEnrollment from '../hooks/useEnrollment';
import useLearningProgress from '../hooks/useLearningProgress';
import useCompleteMaterial from '../hooks/useCompleteMaterial';
import useCourseModules from '@/features/courses/hooks/useCourseModules';
import useMyCertificates from '@/features/certificates/hooks/useMyCertificates';
import useIssueCertificate from '@/features/certificates/hooks/useIssueCertificate';

vi.mock('../hooks/useEnrollment');
vi.mock('../hooks/useLearningProgress');
vi.mock('../hooks/useCompleteMaterial');
vi.mock('@/features/courses/hooks/useCourseModules');
vi.mock('@/features/certificates/hooks/useMyCertificates');
vi.mock('@/features/certificates/hooks/useIssueCertificate');

const mockUseEnrollment = vi.mocked(useEnrollment);
const mockUseLearningProgress = vi.mocked(useLearningProgress);
const mockUseCompleteMaterial = vi.mocked(useCompleteMaterial);
const mockUseCourseModules = vi.mocked(useCourseModules);
const mockUseMyCertificates = vi.mocked(useMyCertificates);
const mockUseIssueCertificate = vi.mocked(useIssueCertificate);

describe('LearningPlayerPage', () => {
    const mockMutate = vi.fn();
    const mockIssueMutate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseCompleteMaterial.mockReturnValue({
            mutate: mockMutate,
            isPending: false,
            variables: undefined,
        } as any);
        mockUseMyCertificates.mockReturnValue({
            data: { certificates: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null } },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseIssueCertificate.mockReturnValue({
            mutate: mockIssueMutate,
            isPending: false,
            isError: false,
            error: null,
        } as any);
    });

    const mockEnrollment = {
        id: 7,
        user_id: 1,
        course_id: 10,
        status: 'IN_PROGRESS' as const,
        enrolled_at: '2026-03-01T10:00:00Z',
        course: {
            id: 10,
            title: 'International Treaty Implementation',
            slug: 'international-treaty-implementation',
            description: 'Operational guidelines for international conventions.',
            thumbnail: null,
            category: { id: 3, name: 'Legal Affairs' },
            estimated_duration: 8,
            status: 'PUBLISHED' as const,
            instructors: [{ id: 4, name: 'Legal Counsel Sarah' }],
        },
    };

    const mockProgress = {
        enrollment_id: 7,
        course_id: 10,
        status: 'IN_PROGRESS' as const,
        progress: 50,
        total_mandatory_materials: 2,
        completed_mandatory_materials: 1,
    };

    const mockModules = [
        {
            id: 100,
            course_id: 10,
            title: 'Module 1: Legal Frameworks',
            description: 'Constitutional basis and ratification.',
            sort_order: 1,
            materials: [
                {
                    id: 201,
                    module_id: 100,
                    title: 'Vienna Convention Fundamentals',
                    type: 'TEXT' as const,
                    content: 'Detailed text regarding the law of treaties.',
                    sort_order: 1,
                    is_mandatory: true,
                },
                {
                    id: 202,
                    module_id: 100,
                    title: 'Ratification Protocol Document',
                    type: 'PDF' as const,
                    file_path: 'documents/ratification.pdf',
                    sort_order: 2,
                    is_mandatory: true,
                },
            ],
        },
    ];

    it('renders loading skeleton while fetching enrollment', () => {
        mockUseEnrollment.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({ data: [], isLoading: false } as any);
        mockUseLearningProgress.mockReturnValue({ data: undefined, isLoading: false } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('learning-player-skeleton')).toBeInTheDocument();
    });

    it('renders course hero, progress card, and curriculum materials', () => {
        mockUseEnrollment.mockReturnValue({
            data: mockEnrollment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
        } as any);
        mockUseLearningProgress.mockReturnValue({
            data: mockProgress,
            isLoading: false,
        } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('International Treaty Implementation')).toBeInTheDocument();
        expect(screen.getByText(/50% Completed/i)).toBeInTheDocument();
        expect(screen.getByText('1 / 2 finished')).toBeInTheDocument();
        expect(screen.getByText('Module 1: Legal Frameworks')).toBeInTheDocument();
        expect(screen.getByText('Vienna Convention Fundamentals')).toBeInTheDocument();
        expect(screen.getByText('Ratification Protocol Document')).toBeInTheDocument();
    });

    it('opens material content viewer when a material is selected', () => {
        mockUseEnrollment.mockReturnValue({
            data: mockEnrollment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
        } as any);
        mockUseLearningProgress.mockReturnValue({
            data: mockProgress,
            isLoading: false,
        } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Click "View" button for first material
        const viewButtons = screen.getAllByRole('button', { name: /View/i });
        fireEvent.click(viewButtons[0]);

        expect(screen.getByText('Material Reader')).toBeInTheDocument();
        expect(screen.getByText('Detailed text regarding the law of treaties.')).toBeInTheDocument();
    });

    it('triggers completeMaterial mutation when Mark Complete button is clicked', () => {
        mockUseEnrollment.mockReturnValue({
            data: mockEnrollment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
        } as any);
        mockUseLearningProgress.mockReturnValue({
            data: mockProgress,
            isLoading: false,
        } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        const markCompleteButtons = screen.getAllByRole('button', { name: /Mark Complete/i });
        fireEvent.click(markCompleteButtons[0]);

        expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
                enrollmentId: '7',
                materialId: 201,
            }),
            expect.any(Object)
        );
    });

    it('does not render course assessment card when quiz_id is absent from search params', () => {
        mockUseEnrollment.mockReturnValue({
            data: mockEnrollment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
        } as any);
        mockUseLearningProgress.mockReturnValue({
            data: mockProgress,
            isLoading: false,
        } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByTestId('course-assessment-card')).not.toBeInTheDocument();
    });

    it('renders course assessment card with link when explicit quiz_id is provided in URL search params', () => {
        mockUseEnrollment.mockReturnValue({
            data: mockEnrollment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
        } as any);
        mockUseLearningProgress.mockReturnValue({
            data: mockProgress,
            isLoading: false,
        } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7?quiz_id=42']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        const card = screen.getByTestId('course-assessment-card');
        expect(card).toBeInTheDocument();
        expect(screen.getByText('Course Assessment')).toBeInTheDocument();

        const ctaLink = screen.getByRole('link', { name: /start assessment/i });
        expect(ctaLink).toHaveAttribute('href', '/my-learning/7/quizzes/42');
    });

    it('renders ELMS Certificate Earned card when certificate exists for enrollment', () => {
        mockUseEnrollment.mockReturnValue({
            data: mockEnrollment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
        } as any);
        mockUseLearningProgress.mockReturnValue({
            data: mockProgress,
            isLoading: false,
        } as any);
        mockUseMyCertificates.mockReturnValue({
            data: {
                certificates: [
                    {
                        id: 1,
                        certificate_number: 'ELMS-2026-000001',
                        enrollment_id: 7,
                        course: { id: 10, title: 'International Treaty Implementation', slug: 'treaty' },
                        employee: { id: 1, name: 'Siti Rahmawati', nip: null },
                        issued_at: '2026-09-16T10:00:00Z',
                        created_at: '2026-09-16T10:00:00Z',
                    },
                ],
                meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('certificate-earned-card')).toBeInTheDocument();
        expect(screen.getByText('ELMS Certificate Earned')).toBeInTheDocument();
        expect(screen.getByText('ELMS-2026-000001')).toBeInTheDocument();

        const viewCta = screen.getByTestId('view-certificate-cta');
        expect(viewCta).toHaveAttribute('href', '/certificates/1');
    });

    it('renders Request Certificate button when enrollment status is COMPLETED and certificate does not exist', () => {
        const completedEnrollment = {
            ...mockEnrollment,
            status: 'COMPLETED' as const,
        };
        const completedProgress = {
            ...mockProgress,
            status: 'COMPLETED' as const,
            progress: 100,
        };

        mockUseEnrollment.mockReturnValue({
            data: completedEnrollment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
        } as any);
        mockUseLearningProgress.mockReturnValue({
            data: completedProgress,
            isLoading: false,
        } as any);
        mockUseMyCertificates.mockReturnValue({
            data: { certificates: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null } },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        const requestBtn = screen.getByTestId('request-certificate-btn');
        expect(requestBtn).toBeInTheDocument();
        expect(screen.getByText('Request Certificate')).toBeInTheDocument();

        fireEvent.click(requestBtn);
        expect(mockIssueMutate).toHaveBeenCalledWith('7');
    });

    it('does not render Request Certificate when status is not COMPLETED and certificate does not exist', () => {
        mockUseEnrollment.mockReturnValue({
            data: mockEnrollment, // status: IN_PROGRESS
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
        } as any);
        mockUseLearningProgress.mockReturnValue({
            data: mockProgress,
            isLoading: false,
        } as any);
        mockUseMyCertificates.mockReturnValue({
            data: { certificates: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null } },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/my-learning/7']}>
                <Routes>
                    <Route path="/my-learning/:enrollmentId" element={<LearningPlayerPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByTestId('certificate-earned-card')).not.toBeInTheDocument();
        expect(screen.queryByTestId('request-certificate-btn')).not.toBeInTheDocument();
    });
});

