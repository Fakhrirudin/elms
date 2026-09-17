import React from 'react';
import { Course } from '../types';
import CourseCard from './CourseCard';

interface CourseGridProps {
    courses: Course[];
}

export const CourseGrid: React.FC<CourseGridProps> = ({ courses }) => {
    return (
        <div
            data-testid="course-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
            {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
            ))}
        </div>
    );
};

export default CourseGrid;

