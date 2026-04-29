import { api } from "./http";
import type { FacilityCardsResponse, FacilityCardItem } from "./types";

export type UpdateFacilityPayload = {
  name: string;
  description: string;
  usageGuideline: string;
  maxPeople: number;
  schedules: Array<{
    dayOfWeek: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
    startTime: string;
    endTime: string;
  }>;
  slotTimes: Array<{
    slotDate: string;
    startTime: string;
    endTime: string;
    isBooking?: boolean;
  }>;
};

export type UpdateFacilityResponse = {
  status: "ok";
  message: string;
  data: FacilityCardItem;
};

export const facilityService = {
  getFacilityCards: async () => {
    const { data } = await api.get<FacilityCardsResponse>("/facilities/cards");
    return data;
  },

  updateFacility: async (
    facilityId: number,
    payload: UpdateFacilityPayload
  ) => {
    const { data } = await api.put<UpdateFacilityResponse>(`/facilities/${facilityId}`, payload);

    return data;
  },

  deleteFacility: async (facilityId: number) => {
    const { data } = await api.delete(`/facilities/${facilityId}`);

    return data;
  },
};