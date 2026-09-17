import { describe, it, expect, beforeEach, vi } from 'vitest';
import api, { AUTH_TOKEN_KEY } from '../api';

describe('api service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('has baseURL configured to /api/v1', () => {
        expect(api.defaults.baseURL).toBe('/api/v1');
    });

    it('has standard JSON headers', () => {
        expect(api.defaults.headers['Accept']).toBe('application/json');
        expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('attaches Authorization Bearer token from localStorage on request', () => {
        localStorage.setItem(AUTH_TOKEN_KEY, 'test-sanctum-token-123');

        const interceptor = api.interceptors.request as any;
        const handler = interceptor.handlers[0];

        const config = {
            headers: {} as Record<string, string>,
        };

        const modifiedConfig = handler.fulfilled(config);
        expect(modifiedConfig.headers.Authorization).toBe('Bearer test-sanctum-token-123');
    });

    it('does not attach Authorization header if no token is in localStorage', () => {
        const interceptor = api.interceptors.request as any;
        const handler = interceptor.handlers[0];

        const config = {
            headers: {} as Record<string, string>,
        };

        const modifiedConfig = handler.fulfilled(config);
        expect(modifiedConfig.headers.Authorization).toBeUndefined();
    });

    it('removes token and dispatches event on 401 response error', async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, 'expired-token');
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        const interceptor = api.interceptors.response as any;
        const handler = interceptor.handlers[0];

        const error = {
            response: {
                status: 401,
                data: { message: 'Unauthenticated.' },
            },
        };

        await expect(handler.rejected(error)).rejects.toEqual(error);
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    });
});
