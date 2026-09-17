import api from '@/services/api';
import { ApiResponse } from '@/types/api';
import { AuthResponse, LoginPayload } from '@/types/auth';
import { User } from '@/types/user';

export const authService = {
    async login(payload: LoginPayload): Promise<AuthResponse> {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
        return response.data.data;
    },

    async logout(): Promise<void> {
        await api.post<ApiResponse<null>>('/auth/logout');
    },

    async getMe(): Promise<User> {
        const response = await api.get<ApiResponse<User>>('/auth/me');
        return response.data.data;
    },
};

export default authService;
