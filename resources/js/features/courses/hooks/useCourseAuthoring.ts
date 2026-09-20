import { useMutation, useQueryClient } from '@tanstack/react-query';
import courseService from '../services/courseService';
import {
    CourseStatus,
    CreateCoursePayload,
    UpdateCoursePayload,
    CreateModulePayload,
    UpdateModulePayload,
    CreateMaterialPayload,
    UpdateMaterialPayload,
} from '../types';

export const useCourseAuthoring = (courseId?: number | string) => {
    const queryClient = useQueryClient();

    const invalidateCourseData = () => {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        if (courseId) {
            queryClient.invalidateQueries({ queryKey: ['course', String(courseId)] });
            queryClient.invalidateQueries({ queryKey: ['course-modules', String(courseId)] });
            queryClient.invalidateQueries({ queryKey: ['course-instructors', String(courseId)] });
        }
    };

    const createCourseMutation = useMutation({
        mutationFn: (payload: CreateCoursePayload) => courseService.createCourse(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });

    const updateCourseMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number | string; payload: UpdateCoursePayload }) =>
            courseService.updateCourse(id, payload),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number | string; status: CourseStatus }) =>
            courseService.updateCourseStatus(id, status),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const deleteCourseMutation = useMutation({
        mutationFn: (id: number | string) => courseService.deleteCourse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });

    const createModuleMutation = useMutation({
        mutationFn: ({ targetCourseId, payload }: { targetCourseId: number | string; payload: CreateModulePayload }) =>
            courseService.createModule(targetCourseId, payload),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const updateModuleMutation = useMutation({
        mutationFn: ({ moduleId, payload }: { moduleId: number | string; payload: UpdateModulePayload }) =>
            courseService.updateModule(moduleId, payload),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const deleteModuleMutation = useMutation({
        mutationFn: (moduleId: number | string) => courseService.deleteModule(moduleId),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const createMaterialMutation = useMutation({
        mutationFn: ({ moduleId, payload }: { moduleId: number | string; payload: CreateMaterialPayload }) =>
            courseService.createMaterial(moduleId, payload),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const updateMaterialMutation = useMutation({
        mutationFn: ({ materialId, payload }: { materialId: number | string; payload: UpdateMaterialPayload }) =>
            courseService.updateMaterial(materialId, payload),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const deleteMaterialMutation = useMutation({
        mutationFn: (materialId: number | string) => courseService.deleteMaterial(materialId),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const assignInstructorMutation = useMutation({
        mutationFn: ({ targetCourseId, userId }: { targetCourseId: number | string; userId: number }) =>
            courseService.assignInstructor(targetCourseId, userId),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    const removeInstructorMutation = useMutation({
        mutationFn: ({ targetCourseId, userId }: { targetCourseId: number | string; userId: number }) =>
            courseService.removeInstructor(targetCourseId, userId),
        onSuccess: () => {
            invalidateCourseData();
        },
    });

    return {
        createCourse: createCourseMutation.mutateAsync,
        isCreatingCourse: createCourseMutation.isPending,
        createCourseError: createCourseMutation.error,

        updateCourse: updateCourseMutation.mutateAsync,
        isUpdatingCourse: updateCourseMutation.isPending,
        updateCourseError: updateCourseMutation.error,

        updateStatus: updateStatusMutation.mutateAsync,
        isUpdatingStatus: updateStatusMutation.isPending,
        updateStatusError: updateStatusMutation.error,

        deleteCourse: deleteCourseMutation.mutateAsync,
        isDeletingCourse: deleteCourseMutation.isPending,

        createModule: createModuleMutation.mutateAsync,
        isCreatingModule: createModuleMutation.isPending,

        updateModule: updateModuleMutation.mutateAsync,
        isUpdatingModule: updateModuleMutation.isPending,

        deleteModule: deleteModuleMutation.mutateAsync,
        isDeletingModule: deleteModuleMutation.isPending,

        createMaterial: createMaterialMutation.mutateAsync,
        isCreatingMaterial: createMaterialMutation.isPending,

        updateMaterial: updateMaterialMutation.mutateAsync,
        isUpdatingMaterial: updateMaterialMutation.isPending,

        deleteMaterial: deleteMaterialMutation.mutateAsync,
        isDeletingMaterial: deleteMaterialMutation.isPending,

        assignInstructor: assignInstructorMutation.mutateAsync,
        isAssigningInstructor: assignInstructorMutation.isPending,

        removeInstructor: removeInstructorMutation.mutateAsync,
        isRemovingInstructor: removeInstructorMutation.isPending,
    };
};

export default useCourseAuthoring;
