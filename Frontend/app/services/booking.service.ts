import { api } from "./http";
import type {
    FacilitySlotsResponse,
    SubmitBookingRequestPayload,
    SubmitBookingRequestResponse,
    PendingRequestsResponse,
    ApproveResponse,
    RejectResponse,
    MyBookingsResponse,
    CancelBookingResponse,
    NotificationsResponse,
    UpcomingBookingsForStaffResponse,
    CompleteBookingResponse,
} from "./types";

export const bookingService = {
    // Retrieve the available time slots for a specific facility
    async getAvailableSlots(facilityId: number): Promise<FacilitySlotsResponse> {
        const response = await api.get<FacilitySlotsResponse>(
            `/bookings/facilities/${facilityId}/slots`
        );
        return response.data;
    },

    // submit booking request
    async submitBookingRequest(
        payload: SubmitBookingRequestPayload
    ): Promise<SubmitBookingRequestResponse> {
        const response = await api.post<SubmitBookingRequestResponse>(
            `/bookings/requests`,
            payload
        );
        return response.data;
    },

    // Employees obtain the list pending approval
    async getPendingRequests(): Promise<PendingRequestsResponse> {
        const response = await api.get<PendingRequestsResponse>(
            `/bookings/staff/pending`
        );
        return response.data;
    },

    // Staff Approve
    async approveRequest(requestId: number): Promise<ApproveResponse> {
        const response = await api.post<ApproveResponse>(
            `/bookings/requests/${requestId}/approve`,
            {}
        );
        return response.data;
    },

    // Staff Reject
    async rejectRequest(
        requestId: number,
        reason: string
    ): Promise<RejectResponse> {
        const response = await api.post<RejectResponse>(
            `/bookings/requests/${requestId}/reject`,
            { reason }
        );
        return response.data;
    },

    async getMyBookings(): Promise<MyBookingsResponse> {
        const response = await api.get<MyBookingsResponse>(`/bookings/my`);
        return response.data;
    },

    async cancelBooking(bookingId: number): Promise<CancelBookingResponse> {
        const response = await api.post<CancelBookingResponse>(
            `/bookings/${bookingId}/cancel`,
            {}
        );
        return response.data;
    },

    async getNotifications(): Promise<NotificationsResponse> {
        const response = await api.get<NotificationsResponse>(
            `/bookings/notifications`
        );
        return response.data;
    },

    async markNotificationRead(notifId: number): Promise<any> {
        const response = await api.post(`/bookings/notifications/${notifId}/read`);
        return response.data;
    },

    async markAllNotificationsRead(): Promise<any> {
        const response = await api.post(`/bookings/notifications/read-all`);
        return response.data;
    },

    async getUpcomingBookingsForStaff(): Promise<UpcomingBookingsForStaffResponse> {
        const response = await api.get<UpcomingBookingsForStaffResponse>(
            `/bookings/staff/upcoming`
        );
        return response.data;
    },

    async completeBooking(bookingId: number): Promise<CompleteBookingResponse> {
        const response = await api.post<CompleteBookingResponse>(
            `/bookings/${bookingId}/complete`,
            {}
        );
        return response.data;
    },
};