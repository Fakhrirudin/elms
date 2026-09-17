import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { Course } from '../types';

describe('CourseCard', () => {
    const baseCourse: Course = {
        id: 1,
        title: 'Cybersecurity Awareness',
        slug: 'cybersecurity-awareness',
        description: 'Comprehensive cybersecurity hygiene and defense strategies.',
        thumbnail: null,
        category: { id: 3, name: 'Security' },
        estimated_duration: 4,
        status: 'PUBLISHED',
        published_at: '2026-03-01T08:00:00Z',
        instructors: [
            { id: 10, name: 'Alice Smith', email: 'alice@elms.test' },
            { id: 11, name: 'Bob Jones', email: 'bob@elms.test' },
        ],
    };

    it('renders course title, category, duration, and instructor names', () => {
        render(
            <MemoryRouter>
                <CourseCard course={baseCourse} />
            </MemoryRouter>
        );

        expect(screen.getByText('Cybersecurity Awareness')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('4 hrs')).toBeInTheDocument();
        expect(screen.getByText('Alice Smith, Bob Jones')).toBeInTheDocument();
        expect(
            screen.getByText('Comprehensive cybersecurity hygiene and defense strategies.')
        ).toBeInTheDocument();
    });

    it('renders fallback thumbnail when course thumbnail is null', () => {
        render(
            <MemoryRouter>
                <CourseCard course={baseCourse} />
            </MemoryRouter>
        );

        expect(screen.getByTestId('course-card-fallback-thumbnail')).toBeInTheDocument();
        expect(screen.getByText('ELMS Course')).toBeInTheDocument();
    });

    it('renders image thumbnail when course thumbnail URL is provided', () => {
        const courseWithThumbnail: Course = {
            ...baseCourse,
            thumbnail: 'https://images.unsplash.com/photo-course.jpg',
        };

        render(
            <MemoryRouter>
                <CourseCard course={courseWithThumbnail} />
            </MemoryRouter>
        );

        const img = screen.getByRole('img', { name: /cybersecurity awareness/i });
        expect(img).toHaveAttribute('src', 'https://images.unsplash.com/photo-course.jpg');
    });

    it('renders View Syllabus link navigating to /courses/:id', () => {
        render(
            <MemoryRouter>
                <CourseCard course={baseCourse} />
            </MemoryRouter>
        );

        const links = screen.getAllByRole('link');
        const viewSyllabusLink = links.find((l) => l.textContent?.includes('View Syllabus'));
        expect(viewSyllabusLink).toBeDefined();
        expect(viewSyllabusLink).toHaveAttribute('href', '/courses/1');
    });

    it('shows non-published status badge when course is DRAFT', () => {
        const draftCourse: Course = {
            ...baseCourse,
            status: 'DRAFT',
        };

        render(
            <MemoryRouter>
                <CourseCard course={draftCourse} />
            </MemoryRouter>
        );

        expect(screen.getByText('DRAFT')).toBeInTheDocument();
    });
});

