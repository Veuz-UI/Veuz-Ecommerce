import apiClient, { ApiResponse } from './apiClient';
import { User } from '@/context/AuthContext';

export interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export interface AdminInvite {
  id: number;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

class AuthService {
  /**
   * User or Admin Sign-in
   */
  public async login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', { email, password });
  }

  /**
   * Customer Registration
   */
  public async register(
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    mobile?: string
  ): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
      mobile,
    });
  }

  /**
   * Fetch current authenticated user from token
   */
  public async getMe(): Promise<{ success: boolean; user: User }> {
    return apiClient.get<{ success: boolean; user: User }>('/auth/me');
  }

  /**
   * Send email verification link to customer
   */
  public async sendVerification(): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/send-verification');
  }

  /**
   * Request password reset link
   */
  public async forgotPassword(email: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/forgot-password', { email });
  }

  /**
   * Super Admin invites a new admin
   */
  public async inviteAdmin(email: string, role: string = 'ADMIN'): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/invite-admin', { email, role });
  }

  /**
   * Get list of invited admins
   */
  public async getAdminInvites(): Promise<{ success: boolean; invites: AdminInvite[] }> {
    return apiClient.get<{ success: boolean; invites: AdminInvite[] }>('/admin/invites');
  }
}

export const authService = new AuthService();
export default authService;
