import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8201/v1';

export interface ApiResponse<T = any> {
  data?: T;
  errors?: string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers['X-RustyVault-Token'] = token;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // RustyVault API returns data in response.data.data or response.data
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as any;

          // Handle 401 Unauthorized - token invalid or missing
          if (status === 401) {
            useAuthStore.getState().logout();
          }

          const message = data?.errors?.[0] || data?.error || error.message || 'An error occurred';
          const errors = data?.errors || [message];

          return Promise.reject(new ApiError(message, status, errors));
        }

        if (error.request) {
          return Promise.reject(new ApiError('Network error: Could not reach server', 0));
        }

        return Promise.reject(new ApiError(error.message || 'An unexpected error occurred'));
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data || response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data || response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data || response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data || response.data;
  }

  async list<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<ApiResponse<T>>({
      method: 'LIST',
      url,
      ...config,
    });
    return response.data.data || response.data;
  }
}

export const apiClient = new ApiClient();

