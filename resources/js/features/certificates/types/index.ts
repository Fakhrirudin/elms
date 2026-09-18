export interface CertificateCourse {
    id: number;
    title: string;
    slug: string;
}

export interface CertificateEmployee {
    id: number;
    name: string;
    nip: string | null;
}

export interface Certificate {
    id: number;
    certificate_number: string;
    enrollment_id: number;
    course: CertificateCourse;
    employee: CertificateEmployee;
    issued_at: string | null;
    created_at: string;
}

export interface CertificateListResult {
    certificates: Certificate[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
}

