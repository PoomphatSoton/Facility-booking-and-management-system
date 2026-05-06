import { useEffect, useState } from "react";
import { partnerMatchingService, type IncomingPartnerRequestItem } from "../services/partner-matching.service";
import "./partner-matching.css";

type RequestStatus = "pending" | "accepted" | "rejected";

type PartnerRequestItem = {
  id: number;
  fromName: string;
  sport: string;
  message: string;
  status: RequestStatus;
  bookingId: number | null;
  facilityName: string | null;
  bookingDate: string | null;
  bookingStartTime: string | null;
  bookingEndTime: string | null;
  intendedActivity: string | null;
};

export default function PartnerRequests() {
  const [requests, setRequests] = useState<PartnerRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const mapIncomingRequest = (
      item: IncomingPartnerRequestItem
  ): PartnerRequestItem => {
    const fullName =
        [item.first_name, item.last_name].filter(Boolean).join(" ").trim() ||
        item.email ||
        "Unknown Member";

    const isBookingInvite = Boolean(item.booking_id);

    return {
      id: item.request_matching_id,
      fromName: fullName,
      sport: isBookingInvite ? "Booking Invite" : "Activity Match",
      message: isBookingInvite
          ? `${fullName} invited you to join their booking.`
          : `Partner request received from ${fullName}.`,
      status: item.status,
      bookingId: item.booking_id ?? null,
      facilityName: item.facility_name ?? null,
      bookingDate: item.booking_date ?? null,
      bookingStartTime: item.booking_start_time ?? null,
      bookingEndTime: item.booking_end_time ?? null,
      intendedActivity: item.intended_activity ?? null,
    };
  };

  const loadIncomingRequests = async () => {
    try {
      setLoading(true);
      const result = await partnerMatchingService.getIncomingRequests();
      setRequests((result.data || []).map(mapIncomingRequest));
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load incoming partner requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: "accepted" | "rejected") => {
    try {
      setUpdatingId(id);
      await partnerMatchingService.updateRequestStatus(id, status);
      await loadIncomingRequests();
      alert(`Request ${status}`);
    } catch (err: any) {
      console.error(err);
      // 显示服务端的错误消息（如 "facility capacity is full"）
      const serverMsg =
          err?.response?.data?.message || err?.message || "Failed to update request status";
      alert(serverMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    void loadIncomingRequests();
  }, []);

  return (
      <main className="partner-matching-page">
        <div className="partner-matching-page-header">
          <h1>Partner Requests</h1>
          <p>Manage incoming match requests from other members</p>
        </div>

        <section className="partner-request-section">
          <h2>Incoming Requests</h2>

          {loading ? (
              <p>Loading...</p>
          ) : error ? (
              <p className="partner-empty-state" style={{ color: "red" }}>
                {error}
              </p>
          ) : requests.length === 0 ? (
              <p className="partner-empty-state">No incoming partner requests.</p>
          ) : (
              <div className="partner-request-list">
                {requests.map((request) => (
                    <div key={request.id} className="partner-request-card">
                      <p>
                        <strong>From:</strong> {request.fromName}
                      </p>
                      <p>
                        <strong>Type:</strong> {request.sport}
                      </p>
                      <p>
                        <strong>Message:</strong> {request.message}
                      </p>

                      {request.bookingId && (
                          <div
                              style={{
                                background: "#f5f9ff",
                                border: "1px solid #d4e3f7",
                                borderRadius: "6px",
                                padding: "10px 12px",
                                margin: "8px 0",
                              }}
                          >
                            <div>
                              <strong>Facility:</strong>{" "}
                              {request.facilityName || "Unknown"}
                            </div>
                            <div>
                              <strong>When:</strong>{" "}
                              {request.bookingDate} ·{" "}
                              {request.bookingStartTime} – {request.bookingEndTime}
                            </div>
                            {request.intendedActivity && (
                                <div>
                                  <strong>Activity:</strong> {request.intendedActivity}
                                </div>
                            )}
                            <div
                                style={{ marginTop: "6px", fontSize: "0.85em", color: "#555" }}
                            >
                              Accepting will add you to this booking automatically — no
                              staff approval needed.
                            </div>
                          </div>
                      )}

                      <span className={`partner-request-status ${request.status}`}>
                  {request.status}
                </span>

                      {request.status === "pending" ? (
                          <div
                              className="partner-card-actions"
                              style={{ marginTop: "1rem" }}
                          >
                            <button
                                className="partner-primary-btn"
                                onClick={() => void updateStatus(request.id, "accepted")}
                                disabled={updatingId === request.id}
                            >
                              {updatingId === request.id ? "Updating..." : "Accept"}
                            </button>
                            <button
                                className="partner-secondary-btn"
                                onClick={() => void updateStatus(request.id, "rejected")}
                                disabled={updatingId === request.id}
                            >
                              {updatingId === request.id ? "Updating..." : "Reject"}
                            </button>
                          </div>
                      ) : null}
                    </div>
                ))}
              </div>
          )}
        </section>
      </main>
  );
}