import React, { useState, useEffect, useRef } from 'react';
import { Material } from '@/features/courses/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import {
    BookOpen,
    Video,
    FileText,
    CheckCircle2,
    Loader2,
    Clock,
    ExternalLink,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';

interface MaterialContentViewerProps {
    material: Material | null;
    enrollmentId?: number | string;
    isCompleted: boolean;
    isCompleting: boolean;
    onClose: () => void;
    onMarkComplete: (materialId: number) => void;
}

/**
 * Extracts page count and text streams from a PDF binary/text payload.
 */
function parsePdfPayload(rawText: string): { numPages: number; pagesText: string[] } {
    let numPages = 1;

    // 1. Determine page count from /Count or /Type /Page
    const countMatch = rawText.match(/\/Count\s+(\d+)/);
    if (countMatch) {
        const parsed = parseInt(countMatch[1], 10);
        if (!isNaN(parsed) && parsed > 0) {
            numPages = parsed;
        }
    } else {
        const pageMatches = rawText.match(/\/Type\s*\/Page\b/g);
        if (pageMatches && pageMatches.length > 0) {
            numPages = pageMatches.length;
        }
    }

    // 2. Extract text streams from BT ... ET blocks if available
    const pagesText: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let m: RegExpExecArray | null;
    while ((m = streamRegex.exec(rawText)) !== null) {
        const raw = m[1];
        const textLines: string[] = [];
        const tjRegex = /\(([\s\S]*?)\)\s*Tj/g;
        let tj: RegExpExecArray | null;
        while ((tj = tjRegex.exec(raw)) !== null) {
            textLines.push(tj[1].replace(/\\\(/g, '(').replace(/\\\)/g, ')'));
        }
        if (textLines.length > 0) {
            pagesText.push(textLines.join('\n'));
        }
    }

    // Fill missing pages fallback
    while (pagesText.length < numPages) {
        pagesText.push(`Halaman ${pagesText.length + 1} materi pembelajaran.`);
    }

    return { numPages, pagesText };
}

export const MaterialContentViewer: React.FC<MaterialContentViewerProps> = ({
    material,
    enrollmentId,
    isCompleted,
    isCompleting,
    onClose,
    onMarkComplete,
}) => {
    // PDF State
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState<number>(0);

    // Multi-page tracking state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [numPages, setNumPages] = useState<number>(1);
    const [pagesText, setPagesText] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'reader' | 'document'>('reader');

    // Dwell time & safeguards
    const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
    const [timeOnFinalPage, setTimeOnFinalPage] = useState<number>(0);
    const completionTriggeredRef = useRef<number | null>(null);

    // Reset page and timer state when material changes
    useEffect(() => {
        setCurrentPage(1);
        setNumPages(1);
        setPagesText([]);
        setTotalTimeSpent(0);
        setTimeOnFinalPage(0);
        completionTriggeredRef.current = null;
    }, [material?.id]);

    // Fetch PDF document via authenticated API when material is PDF
    useEffect(() => {
        if (!material || material.type !== 'PDF') {
            setPdfBlobUrl(null);
            setIsLoadingPdf(false);
            setPdfError(null);
            return;
        }

        let isMounted = true;
        let objectUrl: string | null = null;

        setIsLoadingPdf(true);
        setPdfError(null);

        const streamUrl = enrollmentId
            ? `/enrollments/${enrollmentId}/materials/${material.id}/file`
            : `/materials/${material.id}/file`;

        api.get(streamUrl, { responseType: 'blob' })
            .then(async (response) => {
                if (!isMounted) return;

                const blob = new Blob([response.data], { type: 'application/pdf' });
                objectUrl = URL.createObjectURL(blob);
                setPdfBlobUrl(objectUrl);

                // Parse PDF structure (numPages & page text streams)
                try {
                    const text = await blob.text();
                    const parsed = parsePdfPayload(text);
                    if (isMounted) {
                        setNumPages(parsed.numPages);
                        setPagesText(parsed.pagesText);
                    }
                } catch {
                    // Fallback to 1 page if text reading fails
                    if (isMounted) {
                        setNumPages(1);
                    }
                }

                setIsLoadingPdf(false);
            })
            .catch((err) => {
                if (!isMounted) return;
                setIsLoadingPdf(false);
                const message =
                    err.response?.data?.message ||
                    err.message ||
                    'Tidak dapat memuat dokumen PDF dari server penyimpanan.';
                setPdfError(message);
            });

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [material?.id, material?.type, enrollmentId, reloadKey]);

    // Active reading time tracking
    useEffect(() => {
        if (!material || isCompleted) return;

        const interval = setInterval(() => {
            setTotalTimeSpent((t) => t + 1);
            if (currentPage === numPages) {
                setTimeOnFinalPage((f) => f + 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [material, isCompleted, currentPage, numPages]);

    // Reliable PDF Completion Trigger:
    // ONLY triggered when the learner reaches the LAST PAGE (currentPage === numPages)
    // AND has spent reasonable dwell time (>= 3s on final page AND >= 5s total on document).
    // MERELY OPENING A PDF CANNOT COMPLETE IT.
    useEffect(() => {
        if (!material || isCompleted || isCompleting) {
            return;
        }
        if (completionTriggeredRef.current === material.id) {
            return;
        }

        if (material.type === 'PDF') {
            const isLastPage = currentPage === numPages && numPages > 0;
            const hasSufficientFinalDwell = timeOnFinalPage >= 3 && totalTimeSpent >= 5;

            if (isLastPage && hasSufficientFinalDwell) {
                completionTriggeredRef.current = material.id;
                onMarkComplete(material.id);
            }
        } else if (material.type === 'TEXT') {
            // For text material: requires at least 4s dwell time
            if (totalTimeSpent >= 4) {
                completionTriggeredRef.current = material.id;
                onMarkComplete(material.id);
            }
        } else if (material.type === 'VIDEO') {
            // For video material: requires at least 4s viewing
            if (totalTimeSpent >= 4) {
                completionTriggeredRef.current = material.id;
                onMarkComplete(material.id);
            }
        }
    }, [
        material,
        isCompleted,
        isCompleting,
        currentPage,
        numPages,
        timeOnFinalPage,
        totalTimeSpent,
        onMarkComplete,
    ]);

    if (!material) {
        return null;
    }

    const isLastPage = currentPage === numPages;
    const progressPercent = Math.round((currentPage / Math.max(numPages, 1)) * 100);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((p) => p - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < numPages) {
            setCurrentPage((p) => p + 1);
        }
    };

    const renderContent = () => {
        switch (material.type) {
            case 'TEXT':
                return (
                    <div className="space-y-4" data-testid="text-material-container">
                        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed p-4 rounded-lg bg-muted/20 border border-border/50">
                            {material.content || 'Tidak ada teks tersedia untuk materi ini.'}
                        </div>
                    </div>
                );
            case 'VIDEO':
                return (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center space-y-4" data-testid="video-material-container">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
                            <Video className="h-6 w-6" />
                        </div>
                        <div className="space-y-1.5 max-w-md mx-auto">
                            <h4 className="text-sm font-semibold text-foreground">
                                Video Pembelajaran
                            </h4>
                            <p className="text-xs text-muted-foreground break-all">
                                Sumber video: {material.video_url || 'URL tidak tersedia'}
                            </p>
                            {material.video_url && (
                                <div className="pt-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="text-xs gap-1.5"
                                        data-testid="open-video-link"
                                    >
                                        <a href={material.video_url} target="_blank" rel="noreferrer">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            <span>Tonton Video di Tab Baru</span>
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'PDF':
                if (isLoadingPdf) {
                    return (
                        <div
                            className="h-[520px] flex flex-col items-center justify-center space-y-3 bg-muted/20 rounded-lg border border-border"
                            data-testid="pdf-loading-state"
                        >
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <div className="text-center space-y-1">
                                <p className="text-sm font-semibold text-foreground">
                                    Memuat Dokumen Pembelajaran...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Mengambil dokumen aman dari server backend
                                </p>
                            </div>
                        </div>
                    );
                }

                if (pdfError) {
                    return (
                        <div
                            className="p-8 text-center space-y-3 bg-destructive/5 border border-destructive/20 rounded-lg"
                            data-testid="pdf-error-state"
                        >
                            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-foreground">
                                    Gagal Memuat Dokumen
                                </h4>
                                <p className="text-xs text-muted-foreground">{pdfError}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReloadKey((k) => k + 1)}
                                className="text-xs gap-1.5"
                                data-testid="retry-pdf-load"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Coba Lagi</span>
                            </Button>
                        </div>
                    );
                }

                return (
                    <div className="space-y-4" data-testid="pdf-viewer-container">
                        {/* In-App Reader Toolbar: Page Navigation & Progress */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border text-xs">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                                <span className="font-semibold text-foreground" data-testid="pdf-page-indicator">
                                    Halaman <span data-testid="pdf-current-page">{currentPage}</span> dari{' '}
                                    <span data-testid="pdf-num-pages">{numPages}</span>
                                </span>
                                <span className="text-muted-foreground">({progressPercent}% selesai)</span>
                            </div>

                            {/* View Switcher & Actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('reader')}
                                        className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                                            activeTab === 'reader'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                        data-testid="tab-interactive-reader"
                                    >
                                        Teks Interaktif
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('document')}
                                        className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                                            activeTab === 'document'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                        data-testid="tab-embedded-document"
                                    >
                                        Dokumen PDF
                                    </button>
                                </div>

                                {pdfBlobUrl && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(pdfBlobUrl, '_blank')}
                                        className="h-7 text-xs gap-1.5 font-medium shrink-0"
                                        data-testid="open-pdf-new-tab"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        <span>Tab Baru</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Page Reading Progress Bar */}
                        <div className="space-y-1">
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                    data-testid="pdf-reading-progress"
                                />
                            </div>
                        </div>

                        {/* Document Content View */}
                        {activeTab === 'reader' ? (
                            <div
                                className="min-h-[380px] p-5 sm:p-6 rounded-lg bg-card border border-border shadow-2xs space-y-4"
                                data-testid="pdf-page-text-content"
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-border/60 text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">
                                        Bagian {currentPage}: Materi Pembelajaran
                                    </span>
                                    <span>Halaman {currentPage} / {numPages}</span>
                                </div>

                                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                    {pagesText[currentPage - 1] || 'Memuat halaman pembelajaran...'}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2" data-testid="pdf-embedded-document-view">
                                {pdfBlobUrl ? (
                                    <iframe
                                        src={`${pdfBlobUrl}#page=${currentPage}`}
                                        title={material.title}
                                        className="w-full h-[580px] rounded-lg border border-border shadow-xs bg-white"
                                        data-testid="pdf-embedded-viewer"
                                    />
                                ) : null}
                            </div>
                        )}

                        {/* In-App Page Controls */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handlePrevPage}
                                disabled={currentPage <= 1}
                                className="text-xs gap-1.5 font-medium"
                                data-testid="pdf-prev-page"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span>Halaman Sebelumnya</span>
                            </Button>

                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setCurrentPage(p)}
                                        className={`h-7 w-7 text-xs font-semibold rounded-md border transition-colors ${
                                            currentPage === p
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                                        }`}
                                        data-testid={`page-pill-${p}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <Button
                                size="sm"
                                variant={isLastPage ? 'secondary' : 'default'}
                                onClick={handleNextPage}
                                disabled={currentPage >= numPages}
                                className="text-xs gap-1.5 font-medium"
                                data-testid="pdf-next-page"
                            >
                                <span>Halaman Berikutnya</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                );
            default:
                return (
                    <p className="text-xs text-muted-foreground">
                        Preview materi tidak tersedia untuk tipe ini.
                    </p>
                );
        }
    };

    return (
        <Card className="border-border bg-card shadow-xs" data-testid="material-content-viewer">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                            {material.type}
                        </Badge>
                        <Badge
                            variant={material.is_mandatory ? 'outline' : 'secondary'}
                            className="text-[10px] uppercase font-mono tracking-wider"
                        >
                            {material.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                        {isCompleted ? (
                            <Badge
                                variant="secondary"
                                className="text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            >
                                Selesai
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-medium border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                            >
                                Sedang Belajar
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                        {material.title}
                    </CardTitle>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Tutup reader materi"
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 min-h-[140px]">
                {renderContent()}
            </CardContent>

            <CardFooter className="p-4 sm:p-5 pt-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isCompleted ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>Materi telah selesai dipelajari (Completed).</span>
                        </span>
                    ) : isCompleting ? (
                        <span className="flex items-center gap-1.5 text-primary font-medium">
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            <span>Mencatat progres penyelesaian materi ke server...</span>
                        </span>
                    ) : isLastPage ? (
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="h-4 w-4 animate-pulse shrink-0" />
                            <span>
                                Anda di halaman terakhir ({currentPage}/{numPages}). Sedang memverifikasi pemahaman materi...
                            </span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground font-normal">
                            <BookOpen className="h-4 w-4 shrink-0" />
                            <span>
                                Pelajari seluruh halaman hingga halaman akhir ({numPages}) untuk menyelesaikan materi.
                            </span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isCompleted ? (
                        <Badge
                            variant="secondary"
                            className="gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            data-testid="material-status-badge-completed"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Completed</span>
                        </Badge>
                    ) : isCompleting ? (
                        <Badge
                            variant="outline"
                            className="gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border-primary/30 bg-primary/5"
                            data-testid="material-status-badge-saving"
                        >
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving...</span>
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5"
                            data-testid="material-status-badge-studying"
                        >
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                                {isLastPage
                                    ? `Halaman Terakhir (${currentPage}/${numPages})`
                                    : `Halaman ${currentPage}/${numPages}`}
                            </span>
                        </Badge>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

export default MaterialContentViewer;
