import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/context/AuthContext';
import AppRoutes from '@/router/AppRoutes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: (failureCount, error: any) => {
                if (error?.response?.status && [401, 403, 404].includes(error.response.status)) {
                    return false;
                }
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
    },
});

export const RootApp: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <TooltipProvider delayDuration={0}>
                        <AppRoutes />
                        <Toaster />
                    </TooltipProvider>
                </BrowserRouter>
            </AuthProvider>
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
};

export default RootApp;
