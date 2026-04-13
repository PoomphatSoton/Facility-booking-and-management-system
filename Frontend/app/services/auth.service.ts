import { api } from "./http";
import type {
  CompleteRegisterResponse,
  CompleteRegisterRequest,
  ForgotPasswordRequestRequest,
  ForgotPasswordRequestResponse,
  ForgotPasswordVerifyRequest,
  ForgotPasswordVerifyResponse,
  ForgotPasswordResetRequest,
  ForgotPasswordResetResponse,
  ForgotPasswordResendOtpRequest,
  ForgotPasswordResendOtpResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  SessionStatusResponse,
  RegisterCredentialsRequest,
  RegisterCredentialsResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "./types";

export const authService = {
  registerCredentials: async (body: RegisterCredentialsRequest) => {
    const { data } = await api.post<RegisterCredentialsResponse>(
      "/auth/register/credentials",
      body
    );
    return data;
  },

  verifyOtp: async (body: VerifyOtpRequest) => {
    const { data } = await api.post<VerifyOtpResponse>("/auth/register/otp", body);
    return data;
  },

  resendOtp: async (body: ResendOtpRequest) => {
    const { data } = await api.post<ResendOtpResponse>("/auth/register/resend-otp", body);
    return data;
  },

  completeRegister: async (body: CompleteRegisterRequest) => {
    const { data } = await api.post<CompleteRegisterResponse>(
      "/auth/register/details",
      body
    );
    return data;
  },

  login: async (body: LoginRequest) => {
    const { data } = await api.post<LoginResponse>("/auth/login", body);
    return data;
  },

  logout: async () => {
    await api.post("/auth/logout");
  },

  me: async () => {
    const { data } = await api.get<MeResponse>("/auth/me");
    return data;
  },

  checkLogin: async () => {
    try {
      const { data } = await api.get<SessionStatusResponse>("/auth/session");
      return data;
    } catch {
      return { isLoggedIn: false, isPendingStep3: false, user: null };
    }
  },

  forgotPasswordRequest: async (body: ForgotPasswordRequestRequest) => {
    const { data } = await api.post<ForgotPasswordRequestResponse>("/auth/forgot-password/request", body);
    return data;
  },

  forgotPasswordVerify: async (body: ForgotPasswordVerifyRequest) => {
    const { data } = await api.post<ForgotPasswordVerifyResponse>("/auth/forgot-password/verify", body);
    return data;
  },

  forgotPasswordReset: async (body: ForgotPasswordResetRequest) => {
    const { data } = await api.post<ForgotPasswordResetResponse>("/auth/forgot-password/reset", body);
    return data;
  },

  forgotPasswordResendOtp: async (body: ForgotPasswordResendOtpRequest) => {
    const { data } = await api.post<ForgotPasswordResendOtpResponse>("/auth/forgot-password/resend-otp", body);
    return data;
  },
};
