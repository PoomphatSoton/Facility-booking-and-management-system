import { api } from "./http";
import type {
    FacilitySlotsResponse,
    SubmitBookingRequestPayload,
    SubmitBookingRequestResponse,
    PendingRequestsResponse,
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
};