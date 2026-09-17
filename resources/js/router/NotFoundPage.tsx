import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="max-w-md space-y-4">
                <h1 className="text-6xl font-bold tracking-tight text-primary">404</h1>
                <h2 className="text-2xl font-semibold tracking-tight">Halaman Tidak Ditemukan</h2>
                <p className="text-muted-foreground">
                    Halaman yang Anda cari tidak tersedia atau tautan yang Anda tuju telah dipindahkan.
                </p>
                <div className="pt-2">
                    <Button asChild>
                        <Link to="/dashboard">Kembali ke Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
