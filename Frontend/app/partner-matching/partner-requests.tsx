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

    return {
      id: item.request_matching_id,
      fromName: fullName,
      sport: "Activity Match",
      message: `Partner request received from ${fullName}.`,
      status: item.status,
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
    } catch (err) {
      console.error(err);
      alert("Failed to update request status");
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
                  <strong>Sport:</strong> {request.sport}
                </p>
                <p>
                  <strong>Message:</strong> {request.message}
                </p>

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