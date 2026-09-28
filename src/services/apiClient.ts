/**
 * Centralized API Client (Angular HttpClient equivalent for Next.js)
 * Automatically reads the correct environment API URL (development vs production)
 * and attaches JWT authorization tokens.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

class ApiClient {
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('veuz_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  public async get<T = any>(endpoint: string, headers: Record<string, string> = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(headers),
    });
    return this.handleResponse<T>(res);
  }

  public async post<T = any>(endpoint: string, body?: any, headers: Record<string, string> = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  public async put<T = any>(endpoint: string, body?: any, headers: Record<string, string> = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  public async delete<T = any>(endpoint: string, headers: Record<string, string> = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(headers),
    });
    return this.handleResponse<T>(res);
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { message: res.statusText };
    }

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        // Auto-logout if token is expired or invalid
        localStorage.removeItem('veuz_token');
        localStorage.removeItem('veuz_user');
      }
      const error: any = new Error(data.message || 'API request failed');
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
