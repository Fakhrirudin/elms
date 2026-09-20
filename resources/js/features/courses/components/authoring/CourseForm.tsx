import React, { useState, useEffect } from 'react';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Category, Course, CreateCoursePayload, UpdateCoursePayload } from '../../types';

interface CourseFormProps {
    initialData?: Course | null;
    categories: Category[];
    onSubmit: (data: CreateCoursePayload | UpdateCoursePayload) => Promise<void>;
    isSubmitting: boolean;
    submitButtonLabel?: string;
    errorMessage?: string | null;
}

export const CourseForm: React.FC<CourseFormProps> = ({
    initialData,
    categories,
    onSubmit,
    isSubmitting,
    submitButtonLabel = 'Save Course',
    errorMessage = null,
}) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [categoryId, setCategoryId] = useState<number | string>(initialData?.category?.id || '');
    const [estimatedDuration, setEstimatedDuration] = useState<number | string>(
        initialData?.estimated_duration || 60
    );
    const [description, setDescription] = useState(initialData?.description || '');
    const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || '');
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setCategoryId(initialData.category?.id || '');
            setEstimatedDuration(initialData.estimated_duration || 60);
            setDescription(initialData.description || '');
            setThumbnail(initialData.thumbnail || '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!title.trim()) {
            setValidationError('Course title is required.');
            return;
        }

        if (!categoryId) {
            setValidationError('Please select a category.');
            return;
        }

        const durationNum = Number(estimatedDuration);
        if (!durationNum || durationNum <= 0) {
            setValidationError('Estimated duration must be a positive number of minutes.');
            return;
        }

        const payload: CreateCoursePayload = {
            title: title.trim(),
            category_id: Number(categoryId),
            estimated_duration: durationNum,
            description: description.trim() || null,
            thumbnail: thumbnail.trim() || null,
        };

        await onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {(validationError || errorMessage) && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Error saving course</p>
                        <p>{validationError || errorMessage}</p>
                    </div>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                {/* Title */}
                <div>
                    <label htmlFor="course-title" className="block text-sm font-semibold text-foreground mb-1.5">
                        Course Title <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="course-title"
                        type="text"
                        required
                        maxLength={200}
                        placeholder="e.g. Advanced Laravel REST API Architecture"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                        <label htmlFor="course-category" className="block text-sm font-semibold text-foreground mb-1.5">
                            Category <span className="text-destructive">*</span>
                        </label>
                        <select
                            id="course-category"
                            required
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        >
                            <option value="">Select a Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Estimated Duration */}
                    <div>
                        <label htmlFor="course-duration" className="block text-sm font-semibold text-foreground mb-1.5">
                            Estimated Duration (minutes) <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="course-duration"
                            type="number"
                            required
                            min={1}
                            placeholder="e.g. 180"
                            value={estimatedDuration}
                            onChange={(e) => setEstimatedDuration(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="course-description" className="block text-sm font-semibold text-foreground mb-1.5">
                        Description
                    </label>
                    <textarea
                        id="course-description"
                        rows={4}
                        placeholder="Provide a comprehensive summary of what learners will gain from this course..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-y"
                    />
                </div>

                {/* Thumbnail */}
                <div>
                    <label htmlFor="course-thumbnail" className="block text-sm font-semibold text-foreground mb-1.5">
                        Thumbnail URL / Path
                    </label>
                    <div className="flex gap-3 items-start">
                        <div className="relative flex-1">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                id="course-thumbnail"
                                type="text"
                                maxLength={255}
                                placeholder="https://example.com/images/course.jpg or /images/thumbnail.png"
                                value={thumbnail}
                                onChange={(e) => setThumbnail(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        {thumbnail && (
                            <div className="w-16 h-10 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                                <img
                                    src={thumbnail}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                        Optional image link to illustrate the course card in the public catalog.
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </div>
                    ) : (
                        submitButtonLabel
                    )}
                </button>
            </div>
        </form>
    );
};

export default CourseForm;
