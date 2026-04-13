import { api } from "./http";
import type { FacilityCardsResponse } from "./types";

export const facilityService = {
  getFacilityCards: async () => {
    const { data } = await api.get<FacilityCardsResponse>("/facilities/cards");
    return data;
  },
};
