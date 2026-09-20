import api from '@/services/api';
import { ApiResponse } from '@/types/api';
import { AuthResponse, ForgotPasswordPayload, LoginPayload, RegisterPayload, ResetPasswordPayload } from '@/types/auth';
import { DepartmentSummary, User } from '@/types/user';

export const authService = {
    async login(payload: LoginPayload): Promise<AuthResponse> {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
        return response.data.data;
    },

    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
        return response.data.data;
    },

    async forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse<null>> {
        const response = await api.post<ApiResponse<null>>('/auth/forgot-password', payload);
        return response.data;
    },

    async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<null>> {
        const response = await api.post<ApiResponse<null>>('/auth/reset-password', payload);
        return response.data;
    },

    async getDepartments(): Promise<DepartmentSummary[]> {
        const response = await api.get<ApiResponse<DepartmentSummary[]>>('/auth/departments');
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
