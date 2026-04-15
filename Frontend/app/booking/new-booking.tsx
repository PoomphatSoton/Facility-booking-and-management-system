import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Alert, Button, Card, Form, Spinner } from "react-bootstrap";
import { bookingService } from "~/services/booking.service";
import type { AvailableSlot, FacilitySlots } from "~/services/types";

export default function NewBooking() {
    // 从 URL 拿 facilityId,例如 /booking/new/1 → facilityId = "1"
    const { facilityId } = useParams<{ facilityId: string }>();
    const navigate = useNavigate();

    // 页面状态
    const [facilityData, setFacilityData] = useState<FacilitySlots | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
    const [activity, setActivity] = useState("");

    // UI 状态
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // 页面加载时,拉取该场馆的可用时段
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

    // 提交预约
    const handleSubmit = async () => {
        if (!selectedSlot || !facilityData) {
            setErrorMsg("Please select a time slot first");
            return;
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
                slotDate: selectedSlot.slotDate,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                intendedActivity: activity.trim(),
            });

            if (response.status === "ok") {
                setSuccessMsg(
                    "Booking request submitted! Waiting for staff approval."
                );
                // 3 秒后跳回首页
                setTimeout(() => navigate("/"), 3000);
            } else {
                setErrorMsg(response.message || "Failed to submit");
            }
        } catch (err: any) {
            // axios 拦截后错误结构在 err.message 或 err 本身
            const apiMessage = err?.message || "Failed to submit booking request";
            setErrorMsg(apiMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // ============= 渲染 =============

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

    // 把时段按日期分组,方便展示
    const slotsByDate = facilityData.slots.reduce<Record<string, AvailableSlot[]>>(
        (acc, slot) => {
            if (!acc[slot.slotDate]) acc[slot.slotDate] = [];
            acc[slot.slotDate].push(slot);
            return acc;
        },
        {}
    );

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

            {/* 时段选择 */}
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>1. Select a time slot</Card.Title>

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
                        {isFull && " (Full)"}
                        </Button>
                    );
                    })}
                </div>
                </div>
            ))}
            </Card.Body>
            </Card>

            {/* 活动描述 */}
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

            {/* 已选时段提示 */}
            {selectedSlot && (
                <Alert variant="info">
                    <strong>Your booking:</strong> {facilityData.facilityName} on{" "}
                {selectedSlot.slotDate} from {selectedSlot.startTime} to{" "}
                {selectedSlot.endTime}
                </Alert>
            )}

            {/* 提交按钮 */}
            <div className="d-flex gap-2">
            <Button
                variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedSlot || !activity.trim() || submitting}
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