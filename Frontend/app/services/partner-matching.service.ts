import { api } from "./http";

export type PartnerRequestStatus = "pending" | "accepted" | "rejected";

export interface PartnerItem {
  member_id: number;
  user_id?: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  sport?: string | null;
  skill_level?: string | null;
  availability?: string | null;
  preferred_time?: string | null;
  bio?: string | null;
}

export interface PartnersResponse {
  message: string;
  data: PartnerItem[];
}

export interface IncomingPartnerRequestItem {
  request_matching_id: number;
  status: PartnerRequestStatus;
  created_at: string;
  sender_user_id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface IncomingPartnerRequestResponse {
  message: string;
  data: IncomingPartnerRequestItem[];
}

export const partnerMatchingService = {
  getPartners: async () => {
    const { data } = await api.get<PartnersResponse>(
      "/partner-matching/partners"
    );
    return data;
  },

  createMatchRequest: async (receiverMemberId: number) => {
    const { data } = await api.post("/partner-matching/requests", {
      receiverMemberId,
    });
    return data;
  },

  getIncomingRequests: async () => {
    const { data } = await api.get<IncomingPartnerRequestResponse>(
      "/partner-matching/requests/incoming"
    );
    return data;
  },

  updateRequestStatus: async (
    requestId: number,
    status: "accepted" | "rejected"
  ) => {
    const { data } = await api.patch(
      `/partner-matching/requests/${requestId}/status`,
      { status }
    );
    return data;
  },
};