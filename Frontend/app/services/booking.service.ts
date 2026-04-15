import { api } from "./http";
import type {
    FacilitySlotsResponse,
    SubmitBookingRequestPayload,
    SubmitBookingRequestResponse,
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
};