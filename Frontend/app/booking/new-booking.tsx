import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Alert, Button, Card, Form, Spinner } from "react-bootstrap";
import { bookingService } from "~/services/booking.service";
import type { AvailableSlot, FacilitySlots } from "~/services/types";

export default function NewBooking() {
    const { facilityId } = useParams<{ facilityId: string }>();
    const navigate = useNavigate();

    const [facilityData, setFacilityData] = useState<FacilitySlots | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
    const [activity, setActivity] = useState("");

    // select time
    const [useCustomTime, setUseCustomTime] = useState(false);
    const [customDate, setCustomDate] = useState("");
    const [customStartTime, setCustomStartTime] = useState("");
    const [customEndTime, setCustomEndTime] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        const loadSlots = async () => {
            if (!facilityId) return;
            try {
                setLoading(true);
                setErrorMsg("");
                const response = await bookingService.getAvailableSlots(
                    parseInt(facilityId, 10)
                );
                if (response.status === "ok") {
                    setFacilityData(response.data);
                } else {
                    setErrorMsg(response.message || "Failed to load slots");
                }
            } catch (err: any) {
                setErrorMsg(err.message || "Failed to load slots");
            } finally {
                setLoading(false);
            }
        };
        void loadSlots();
    }, [facilityId]);

    const handleSubmit = async () => {
        if (!facilityData) return;

        let slotDate: string;
        let startTime: string;
        let endTime: string;
        let isCustom: boolean;

        if (useCustomTime) {
            if (!customDate || !customStartTime || !customEndTime) {
                setErrorMsg("Please fill in date, start time, and end time");
                return;
            }
            if (customStartTime >= customEndTime) {
                setErrorMsg("End time must be after start time");
                return;
            }
            slotDate = customDate;
            startTime = customStartTime;
            endTime = customEndTime;
            isCustom = true;
        } else {
            if (!selectedSlot) {
                setErrorMsg("Please select a time slot");
                return;
            }
            slotDate = selectedSlot.slotDate;
            startTime = selectedSlot.startTime;
            endTime = selectedSlot.endTime;
            isCustom = false;
        }

        if (!activity.trim()) {
            setErrorMsg("Please describe your intended activity");
            return;
        }

        try {
            setSubmitting(true);
            setErrorMsg("");
            const response = await bookingService.submitBookingRequest({
                facilityId: facilityData.facilityId,
                slotDate,
                startTime,
                endTime,
                intendedActivity: activity.trim(),
                customTime: isCustom,
            });

            if (response.status === "ok") {
                setSuccessMsg(
                    "Booking request submitted! Waiting for staff approval."
                );
                setTimeout(() => navigate("/"), 3000);
            } else {
                setErrorMsg(response.message || "Failed to submit");
            }
        } catch (err: any) {
            const apiMessage = err?.message || "Failed to submit booking request";
            setErrorMsg(apiMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Loading available slots...</p>
            </div>
        );
    }

    if (!facilityData) {
        return (
            <div className="container py-5">
                <Alert variant="danger">{errorMsg || "Facility not found"}</Alert>
                <Button variant="secondary" onClick={() => navigate("/")}>
                    Back to facilities
                </Button>
            </div>
        );
    }

    const slotsByDate = facilityData.slots.reduce<Record<string, AvailableSlot[]>>(
        (acc, slot) => {
            if (!acc[slot.slotDate]) acc[slot.slotDate] = [];
            acc[slot.slotDate].push(slot);
            return acc;
        },
        {}
    );

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="container py-4" style={{ maxWidth: "900px" }}>
            <Button
                variant="link"
                className="px-0 mb-3"
                onClick={() => navigate("/")}
            >
                ← Back to facilities
            </Button>

            <h2>Book {facilityData.facilityName}</h2>
            <p className="text-muted">
                Capacity: {facilityData.maxPeople} people per slot
            </p>

            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
            {successMsg && <Alert variant="success">{successMsg}</Alert>}

            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>1. Select booking time</Card.Title>

                    <div className="d-flex gap-3 mb-3">
                        <Form.Check
                            type="radio"
                            id="mode-slot"
                            label="Choose a preset time slot"
                            checked={!useCustomTime}
                            onChange={() => {
                                setUseCustomTime(false);
                                setCustomDate("");
                                setCustomStartTime("");
                                setCustomEndTime("");
                            }}
                        />
                        <Form.Check
                            type="radio"
                            id="mode-custom"
                            label="Choose custom time"
                            checked={useCustomTime}
                            onChange={() => {
                                setUseCustomTime(true);
                                setSelectedSlot(null);
                            }}
                        />
                    </div>

                    {!useCustomTime ? (
                        <>
                            {Object.entries(slotsByDate).map(([date, slots]) => (
                                <div key={date} className="mb-3">
                                    <h6 className="mt-3">{date}</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {slots.map((slot) => {
                                            const isSelected =
                                                selectedSlot?.slotTimeId === slot.slotTimeId;
                                            const isFull = !slot.available;
                                            return (
                                                <Button
                                                    key={slot.slotTimeId}
                                                    size="sm"
                                                    variant={
                                                        isFull
                                                            ? "outline-secondary"
                                                            : isSelected
                                                                ? "primary"
                                                                : "outline-primary"
                                                    }
                                                    disabled={isFull}
                                                    onClick={() => setSelectedSlot(slot)}
                                                >
                                                    {slot.startTime} - {slot.endTime}
                                                    {isFull
                                                        ? " (Full)"
                                                        : ` (${facilityData.maxPeople - slot.occupied}/${facilityData.maxPeople} spots left)`}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="row g-3">
                            <div className="col-md-4">
                                <Form.Label>Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={customDate}
                                    min={today}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4">
                                <Form.Label>Start time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={customStartTime}
                                    min="08:00"
                                    max="21:00"
                                    onChange={(e) => setCustomStartTime(e.target.value)}
                                />
                                <Form.Text className="text-muted">From 08:00</Form.Text>
                            </div>
                            <div className="col-md-4">
                                <Form.Label>End time</Form.Label>
                                <Form.Control
                                    type="time"
                                    value={customEndTime}
                                    min="09:00"
                                    max="22:00"
                                    onChange={(e) => setCustomEndTime(e.target.value)}
                                />
                                <Form.Text className="text-muted">Until 22:00</Form.Text>
                            </div>
                            <div className="col-12">
                                <Alert variant="info" className="mt-2 mb-0">
                                    Custom time allows flexible booking (e.g. 09:30 - 11:45).
                                    Staff will check availability when reviewing your request.
                                </Alert>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>2. Describe your intended activity</Card.Title>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="e.g. Badminton training with 3 friends"
                        value={activity}
                        onChange={(e) => setActivity(e.target.value)}
                        maxLength={500}
                    />
                    <Form.Text className="text-muted">
                        {activity.length} / 500 characters
                    </Form.Text>
                </Card.Body>
            </Card>

            {(selectedSlot || (useCustomTime && customDate && customStartTime && customEndTime)) && (
                <Alert variant="info">
                    <strong>Your booking:</strong> {facilityData.facilityName} on{" "}
                    {useCustomTime ? customDate : selectedSlot!.slotDate} from{" "}
                    {useCustomTime ? customStartTime : selectedSlot!.startTime} to{" "}
                    {useCustomTime ? customEndTime : selectedSlot!.endTime}
                    {useCustomTime && " (custom time)"}
                </Alert>
            )}

            <div className="d-flex gap-2">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={
                        submitting ||
                        !activity.trim() ||
                        (!useCustomTime && !selectedSlot) ||
                        (useCustomTime && (!customDate || !customStartTime || !customEndTime))
                    }
                >
                    {submitting ? "Submitting..." : "Submit Booking Request"}
                </Button>
                <Button
                    variant="outline-secondary"
                    size="lg"
                    onClick={() => navigate("/")}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}