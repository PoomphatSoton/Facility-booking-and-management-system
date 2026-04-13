export interface ApiError {
  message: string;
  nextStep?: RegistrationStep;
  state?: RegistrationStep;
  registrationId?: string;
}

export type RegistrationStep = "credentials" | "otp" | "details";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
}

export interface RegisterCredentialsRequest {
  email: string;
  password: string;
}

export interface RegisterCredentialsResponse {
  registrationId: string;
  nextStep: RegistrationStep;
  message: string;
  delivery?: {
    accepted?: string[];
    rejected?: string[];
    response?: string;
  };
}

export interface VerifyOtpRequest {
  registrationId: string;
  otp: string;
}

export interface ResendOtpRequest {
  registrationId: string;
}

export interface ResendOtpResponse {
  registrationId: string;
  message: string;
}

export interface VerifyOtpResponse {
  registrationId: string;
  nextStep: RegistrationStep;
  message: string;
  token: string;
}

export interface CompleteRegisterRequest {
  registrationId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type AuthenticatedResponse = {
  token: string;
  user: User;
};

export interface LoginPendingResponse {
  token: string;
  nextStep: "details";
  registrationId: string;
  message: string;
}

export type LoginResponse = AuthenticatedResponse | LoginPendingResponse;

export interface CompleteRegisterResponse {
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface SessionStatusResponse {
  isLoggedIn: boolean;
  isPendingStep3: boolean;
  user: User | null;
}

export interface ForgotPasswordRequestRequest {
  email: string;
}

export interface ForgotPasswordRequestResponse {
  resetRequestId: string;
  message: string;
}

export interface ForgotPasswordVerifyRequest {
  resetRequestId: string;
  otp: string;
}

export interface ForgotPasswordVerifyResponse {
  resetToken: string;
  message: string;
}

export interface ForgotPasswordResetRequest {
  resetToken: string;
  newPassword: string;
}

export interface ForgotPasswordResetResponse {
  message: string;
}

export interface ForgotPasswordResendOtpRequest {
  resetRequestId: string;
}

export interface ForgotPasswordResendOtpResponse {
  message: string;
}

export interface FacilityAvailableTime {
  day: string;
  startTime: string;
  endTime: string;
}

export interface FacilityCardItem {
  facilityId: number;
  name: string;
  description: string;
  usageGuideline: string | null;
  maxPeople: number;
  slotDate: string;
  slotToday: string[];
  availableTime: FacilityAvailableTime | null;
  otherAvailableTimes: FacilityAvailableTime[];
}

export interface FacilityCardsResponse {
  status: "ok" | "error";
  data: FacilityCardItem[];
  message?: string;
  detail?: string;
}
