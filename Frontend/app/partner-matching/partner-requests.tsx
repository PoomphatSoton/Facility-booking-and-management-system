import { useState } from "react";
import "./partner-matching.css";

type RequestStatus = "pending" | "accepted" | "rejected";

type PartnerRequestItem = {
  id: number;
  fromName: string;
  sport: string;
  message: string;
  status: RequestStatus;
};

const initialRequests: PartnerRequestItem[] = [
  {
    id: 1,
    fromName: "Alex Chen",
    sport: "Badminton",
    message: "Would you like to train together on Wednesday evening?",
    status: "pending",
  },
  {
    id: 2,
    fromName: "Emily Wong",
    sport: "Tennis",
    message: "Looking for a friendly tennis session this weekend.",
    status: "accepted",
  },
  {
    id: 3,
    fromName: "James Lee",
    sport: "Squash",
    message: "Interested in regular squash practice sessions.",
    status: "rejected",
  },
];

export default function PartnerRequests() {
  const [requests, setRequests] = useState<PartnerRequestItem[]>(initialRequests);

  const updateStatus = (id: number, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );
  };

  return (
    <main className="partner-matching-page">
      <div className="partner-matching-page-header">
        <h1>Partner Requests</h1>
        <p>Manage incoming match requests from other members</p>
      </div>

      <section className="partner-request-section">
        <h2>Incoming Requests</h2>

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

              <span
                className={`partner-request-status ${request.status}`}
              >
                {request.status}
              </span>

              {request.status === "pending" ? (
                <div
                  className="partner-card-actions"
                  style={{ marginTop: "1rem" }}
                >
                  <button
                    className="partner-primary-btn"
                    onClick={() => updateStatus(request.id, "accepted")}
                  >
                    Accept
                  </button>
                  <button
                    className="partner-secondary-btn"
                    onClick={() => updateStatus(request.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}