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
   * Update Profile Details
   */
  public async updateProfile(data: Partial<User>): Promise<{ success: boolean; user: User; message?: string }> {
    return apiClient.put<{ success: boolean; user: User; message?: string }>('/auth/profile', data);
  }

  /**
   * Change Password
   */
  public async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword?: string }): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>('/auth/change-password', data);
  }

  /**
   * Delete Account
   */
  public async deleteAccount(): Promise<{ success: boolean; message?: string }> {
    return apiClient.delete<{ success: boolean; message?: string }>('/auth/account');
  }

  /**
   * Send email verification link to customer
   */
  public async sendVerification(): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/send-verification');
  }

  /**
   * Verify email with token
   */
  public async verifyEmail(token: string): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/verify-email', { token });
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
