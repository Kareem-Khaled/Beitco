import { api } from './client';
import type { UserProfile } from '@beitco/types';

export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export const authApi = {
  sendOtp(phone: string) {
    return api.post<{ message: string }>('/auth/send-otp', { phone }, { noAuth: true });
  },

  verifyOtp(phone: string, code: string) {
    return api.post<AuthTokens>('/auth/verify-otp', { phone, code }, { noAuth: true });
  },

  register(data: { phone: string; code: string; nameAr: string; nameEn?: string; role: string }) {
    return api.post<AuthTokens>('/auth/register', data, { noAuth: true });
  },

  refresh(refreshToken: string) {
    return api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }, { noAuth: true });
  },

  me() {
    return api.get<UserProfile>('/users/me');
  },
};
