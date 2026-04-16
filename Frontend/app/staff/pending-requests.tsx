import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Alert, Badge, Button, Card, Spinner } from "react-bootstrap";
import { bookingService } from "~/services/booking.service";
import type { PendingBookingRequest } from "~/services/types";

export default function PendingRequests() {
    const navigate = useNavigate();

    const [requests, setRequests] = useState<PendingBookingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    // Fetch the pending approval list when the page loads
    useEffect(() => {
        const loadRequests = async () => {
            try {
                setLoading(true);
                setErrorMsg("");
                const response = await bookingService.getPendingRequests();
                if (response.status === "ok") {
                    setRequests(response.data);
                } else {
                    setErrorMsg(response.message || "Failed to load requests");
                }
            } catch (err: any) {
                setErrorMsg(err.message || "Failed to load requests");
            } finally {
                setLoading(false);
            }
        };
        void loadRequests();
    }, []);

    const formatTimeAgo = (isoString: string) => {
        const then = new Date(isoString).getTime();
        const now = Date.now();
        const diffMinutes = Math.floor((now - then) / 60000);
        if (diffMinutes < 1) return "just now";
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hr ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    };


    if (loading) {
        return (
            <div className="container py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Loading pending requests...</p>
            </div>
        );
    }

    return (
        <div className="container py-4" style={{ maxWidth: "1000px" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Pending Booking Requests</h2>
                    <p className="text-muted mb-0">
                        Review and manage booking requests for your facilities
                    </p>
                </div>
                <Badge bg="primary" pill style={{ fontSize: "1rem" }}>
                    {requests.length} pending
                </Badge>
            </div>

            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            {requests.length === 0 && !errorMsg && (
                <Card className="text-center py-5">
                    <Card.Body>
                        <h5 className="text-muted mb-2">No pending requests</h5>
                        <p className="text-muted mb-0">
                            All requests for your facilities have been handled.
                        </p>
                    </Card.Body>
                </Card>
            )}

            {requests.map((req) => (
                <Card key={req.bookingRequestId} className="mb-3 shadow-sm">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 className="mb-1">{req.facility.name}</h5>
                                <div className="text-muted small">
                                    Request #{req.bookingRequestId} · submitted{" "}
                                    {formatTimeAgo(req.createdAt)}
                                </div>
                            </div>
                            <Badge bg="warning" text="dark">
                                Pending
                            </Badge>
                        </div>

                        <hr />

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <div className="text-muted small">Requested by</div>
                                <div>
                                    <strong>
                                        {req.member.firstName} {req.member.lastName}
                                    </strong>
                                </div>
                                <div className="small text-muted">{req.member.email}</div>
                            </div>

                            <div className="col-md-6 mb-3">
                                <div className="text-muted small">Booking time</div>
                                <div>
                                    <strong>{req.bookingDate}</strong>
                                </div>
                                <div>
                                    {req.startTime} – {req.endTime}
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="text-muted small">Intended activity</div>
                                <div>{req.intendedActivity || "(not specified)"}</div>
                            </div>
                        </div>

                        <div className="mt-3 d-flex gap-2">
                            <Button
                                variant="success"
                                size="sm"
                                disabled
                                title="Coming in Stage 3"
                            >
                                Approve
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                disabled
                                title="Coming in Stage 3"
                            >
                                Reject
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled
                                title="Coming in Stage 5"
                            >
                                Suggest Alternative
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
}