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

// ==================== Booking ====================

export interface AvailableSlot {
  slotTimeId: number;
  slotDate: string;       // 'YYYY-MM-DD'
  startTime: string;      // 'HH:MM'
  endTime: string;        // 'HH:MM'
  occupied: number;
  available: boolean;
}

export interface FacilitySlots {
  facilityId: number;
  facilityName: string;
  maxPeople: number;
  slots: AvailableSlot[];
}

export interface FacilitySlotsResponse {
  status: 'ok' | 'error';
  data: FacilitySlots;
  message?: string;
}

export interface SubmitBookingRequestPayload {
  facilityId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  intendedActivity: string;
}

export interface SubmitBookingRequestResponse {
  status: 'ok' | 'error';
  data?: {
    bookingRequestId: number;
    bookingDetailId: number;
    status: string;
    createdAt: string;
  };
  message?: string;
  code?: string;
}

// ==================== Staff Pending Requests ====================

export interface PendingRequestMember {
  memberId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PendingRequestFacility {
  facilityId: number;
  name: string;
}

export interface PendingBookingRequest {
  bookingRequestId: number;
  bookingDetailId: number;
  requestStatus: string;
  createdAt: string;
  facility: PendingRequestFacility;
  bookingDate: string;
  startTime: string;
  endTime: string;
  intendedActivity: string | null;
  member: PendingRequestMember;
}

export interface PendingRequestsResponse {
  status: "ok" | "error";
  data: PendingBookingRequest[];
  message?: string;
}

// ==================== Approve / Reject ====================

export interface ApproveResponse {
  status: "ok" | "error";
  data?: {
    bookingRequestId: number;
    bookingId: number;
    bookingStatus: string;
    message: string;
  };
  message?: string;
  code?: string;
  conflicts?: string[];
}

export interface RejectResponse {
  status: "ok" | "error";
  data?: {
    bookingRequestId: number;
    message: string;
  };
  message?: string;
  code?: string;
}

// ==================== My Bookings ====================

export interface MyBookingItem {
  bookingId?: number;
  bookingRequestId?: number;
  bookingStatus?: string;
  requestStatus?: string;
  createdAt: string;
  facilityId: number;
  facilityName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  intendedActivity: string | null;
  altFacilityId?: string | null;
  altFacilityName?: string | null;
}

export interface MyBookingsData {
  upcoming: MyBookingItem[];
  history: MyBookingItem[];
  pendingRequests: MyBookingItem[];
  rejected: MyBookingItem[];
}

export interface MyBookingsResponse {
  status: "ok" | "error";
  data: MyBookingsData;
  message?: string;
}

export interface CancelBookingResponse {
  status: "ok" | "error";
  data?: { bookingId: number; message: string };
  message?: string;
  code?: string;
}

// ==================== Notifications ====================

export interface NotificationItem {
  notifId: number;
  message: string;
  isRead: boolean;
  type: string | null;
  sendingAt: string;
}

export interface NotificationsResponse {
  status: "ok" | "error";
  data: NotificationItem[];
  message?: string;
}

// ==================== Staff Upcoming / Complete ====================

export interface UpcomingBookingForStaff {
  bookingId: number;
  bookingStatus: string;
  createdAt: string;
  facility: PendingRequestFacility;
  bookingDate: string;
  startTime: string;
  endTime: string;
  intendedActivity: string | null;
  member: PendingRequestMember;
}

export interface UpcomingBookingsForStaffResponse {
  status: "ok" | "error";
  data: UpcomingBookingForStaff[];
  message?: string;
}

export interface CompleteBookingResponse {
  status: "ok" | "error";
  data?: { bookingId: number; message: string };
  message?: string;
  code?: string;
}

// ==================== Alternative Facility ====================

export interface AlternativeFacility {
  facilityId: number;
  name: string;
  description: string | null;
  maxPeople: number;
  occupiedCount: number;
  spotsLeft: number;
}

export interface AlternativesResponse {
  status: "ok" | "error";
  data: AlternativeFacility[];
  message?: string;
}

export interface SuggestAlternativeResponse {
  status: "ok" | "error";
  data?: {
    bookingRequestId: number;
    altFacilityId: number;
    altFacilityName: string;
    message: string;
  };
  message?: string;
}

export interface RespondAlternativeResponse {
  status: "ok" | "error";
  data?: {
    bookingRequestId: number;
    bookingId?: number;
    accepted: boolean;
    altFacilityName?: string;
    message: string;
  };
  message?: string;
  code?: string;
}