import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MaterialContentViewer from '../components/player/MaterialContentViewer';
import { Material } from '@/features/courses/types';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
    api: {
        get: vi.fn(),
    },
}));

const mockApiGet = vi.mocked(api.get);

describe('MaterialContentViewer Component', () => {
    const mockOnClose = vi.fn();
    const mockOnMarkComplete = vi.fn();

    const sampleTextMaterial: Material = {
        id: 101,
        module_id: 1,
        title: 'Pengantar Desain Sistem Modular',
        type: 'TEXT',
        content: 'Penjelasan prinsip modularitas dan decoupling.',
        sort_order: 1,
        is_mandatory: true,
    };

    const samplePdfMaterial: Material = {
        id: 102,
        module_id: 1,
        title: 'Panduan Arsitektur PDF',
        type: 'PDF',
        file_path: 'materials/guide.pdf',
        sort_order: 2,
        is_mandatory: true,
    };

    const sample3PagePdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>
endobj
3 0 obj
<< /Type /Page /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Page /Contents 7 0 R >>
endobj
5 0 obj
<< /Type /Page /Contents 8 0 R >>
endobj
6 0 obj
stream
BT
/F1 12 Tf
(Halaman 1: Pengantar Konsep Arsitektur) Tj
ET
endstream
endobj
7 0 obj
stream
BT
/F1 12 Tf
(Halaman 2: Implementasi Clean Layering) Tj
ET
endstream
endobj
8 0 obj
stream
BT
/F1 12 Tf
(Halaman 3: Rangkuman Akhir dan Kesimpulan) Tj
ET
endstream
endobj
xref
trailer
<< /Root 1 0 R >>
%%EOF`;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Mock URL.createObjectURL & revokeObjectURL in jsdom
        window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/sample-pdf');
        window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders TEXT material content without triggering completion immediately on mount', () => {
        render(
            <MaterialContentViewer
                material={sampleTextMaterial}
                isCompleted={false}
                isCompleting={false}
                onClose={mockOnClose}
                onMarkComplete={mockOnMarkComplete}
            />
        );

        expect(screen.getByText('Pengantar Desain Sistem Modular')).toBeInTheDocument();
        expect(screen.getByText('Penjelasan prinsip modularitas dan decoupling.')).toBeInTheDocument();
        expect(mockOnMarkComplete).not.toHaveBeenCalled();
    });

    it('opens PDF, parses page count (3 pages), and stays uncompleted on Page 1', async () => {
        const blob = new Blob([sample3PagePdfString], { type: 'application/pdf' });
        // Mock blob.text() in jsdom
        blob.text = vi.fn().mockResolvedValue(sample3PagePdfString);

        mockApiGet.mockResolvedValueOnce({ data: blob } as any);

        render(
            <MaterialContentViewer
                material={samplePdfMaterial}
                enrollmentId={1}
                isCompleted={false}
                isCompleting={false}
                onClose={mockOnClose}
                onMarkComplete={mockOnMarkComplete}
            />
        );

        // Initially loading
        expect(screen.getByTestId('pdf-loading-state')).toBeInTheDocument();

        // Advance promise resolution
        await act(async () => {
            await Promise.resolve();
        });

        // After loading, verify page indicator shows Page 1 of 3
        expect(screen.getByTestId('pdf-page-indicator')).toBeInTheDocument();
        expect(screen.getByTestId('pdf-current-page')).toHaveTextContent('1');
        expect(screen.getByTestId('pdf-num-pages')).toHaveTextContent('3');

        // Merely opening must not complete the material
        expect(mockOnMarkComplete).not.toHaveBeenCalled();

        // Advance timer on Page 1: Still must NOT complete because reader is not on the last page!
        act(() => {
            vi.advanceTimersByTime(10000); // 10 seconds on page 1
        });

        expect(mockOnMarkComplete).not.toHaveBeenCalled();
        expect(screen.queryByTestId('material-status-badge-completed')).not.toBeInTheDocument();
    });

    it('navigates through pages and triggers completion ONLY after reaching the last page and spending dwell time', async () => {
        const blob = new Blob([sample3PagePdfString], { type: 'application/pdf' });
        blob.text = vi.fn().mockResolvedValue(sample3PagePdfString);

        mockApiGet.mockResolvedValueOnce({ data: blob } as any);

        render(
            <MaterialContentViewer
                material={samplePdfMaterial}
                enrollmentId={1}
                isCompleted={false}
                isCompleting={false}
                onClose={mockOnClose}
                onMarkComplete={mockOnMarkComplete}
            />
        );

        await act(async () => {
            await Promise.resolve();
        });

        // Advance 2s on Page 1
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(mockOnMarkComplete).not.toHaveBeenCalled();

        // Click next page -> Page 2
        fireEvent.click(screen.getByTestId('pdf-next-page'));
        expect(screen.getByTestId('pdf-current-page')).toHaveTextContent('2');

        // Advance 2s on Page 2
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(mockOnMarkComplete).not.toHaveBeenCalled();

        // Click next page -> Page 3 (Last page)
        fireEvent.click(screen.getByTestId('pdf-next-page'));
        expect(screen.getByTestId('pdf-current-page')).toHaveTextContent('3');
        expect(screen.getByTestId('pdf-next-page')).toBeDisabled();

        // Immediately arriving on page 3 must NOT instantly trigger completion (safeguard)
        expect(mockOnMarkComplete).not.toHaveBeenCalled();

        // Advance 3s dwell time on the final page (total time now = 2 + 2 + 3 = 7s >= 5s total)
        act(() => {
            vi.advanceTimersByTime(3500);
        });

        // Now completion must be triggered!
        expect(mockOnMarkComplete).toHaveBeenCalledTimes(1);
        expect(mockOnMarkComplete).toHaveBeenCalledWith(102);
    });

    it('displays completed status badge when isCompleted is true without triggering mutation', async () => {
        const blob = new Blob([sample3PagePdfString], { type: 'application/pdf' });
        blob.text = vi.fn().mockResolvedValue(sample3PagePdfString);
        mockApiGet.mockResolvedValueOnce({ data: blob } as any);

        render(
            <MaterialContentViewer
                material={samplePdfMaterial}
                enrollmentId={1}
                isCompleted={true}
                isCompleting={false}
                onClose={mockOnClose}
                onMarkComplete={mockOnMarkComplete}
            />
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.getByTestId('material-status-badge-completed')).toBeInTheDocument();
        expect(screen.getByText(/Materi telah selesai dipelajari/i)).toBeInTheDocument();
        expect(mockOnMarkComplete).not.toHaveBeenCalled();
    });

    it('renders error state and retry button if PDF stream fails', async () => {
        mockApiGet.mockRejectedValueOnce(new Error('Koneksi terputus ke server penyimpanan'));

        render(
            <MaterialContentViewer
                material={samplePdfMaterial}
                enrollmentId={1}
                isCompleted={false}
                isCompleting={false}
                onClose={mockOnClose}
                onMarkComplete={mockOnMarkComplete}
            />
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.getByTestId('pdf-error-state')).toBeInTheDocument();
        expect(screen.getByText('Gagal Memuat Dokumen')).toBeInTheDocument();
        expect(screen.getByTestId('retry-pdf-load')).toBeInTheDocument();
    });
});
