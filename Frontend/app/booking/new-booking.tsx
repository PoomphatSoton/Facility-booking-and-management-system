// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router";
// import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
// import { bookingService } from "~/services/booking.service";
// import type { FacilitySlots } from "~/services/types";
//
// export default function NewBooking() {
//     const { facilityId } = useParams<{ facilityId: string }>();
//     const navigate = useNavigate();
//
//     const [facilityData, setFacilityData] = useState<FacilitySlots | null>(null);
//     const [activity, setActivity] = useState("");
//
//     const [selectedDate, setSelectedDate] = useState("");
//     const [startTime, setStartTime] = useState("");
//     const [endTime, setEndTime] = useState("");
//
//     const [spotsInfo, setSpotsInfo] = useState<{
//         occupied: number;
//         available: boolean;
//     } | null>(null);
//
//     const [loading, setLoading] = useState(true);
//     const [submitting, setSubmitting] = useState(false);
//     const [errorMsg, setErrorMsg] = useState("");
//     const [successMsg, setSuccessMsg] = useState("");
//
//     const now = new Date();
//     const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
//
//     // Load facilities information and time slot data
//     useEffect(() => {
//         const loadSlots = async () => {
//             if (!facilityId) return;
//             try {
//                 setLoading(true);
//                 setErrorMsg("");
//                 const response = await bookingService.getAvailableSlots(
//                     parseInt(facilityId, 10)
//                 );
//                 if (response.status === "ok") {
//                     setFacilityData(response.data);
//                 } else {
//                     setErrorMsg(response.message || "Failed to load facility data");
//                 }
//             } catch (err: any) {
//                 setErrorMsg(err.message || "Failed to load facility data");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         void loadSlots();
//     }, [facilityId]);
//
//     // Calculate the occupancy status for this time period
//     useEffect(() => {
//         if (!facilityData || !selectedDate || !startTime || !endTime) {
//             setSpotsInfo(null);
//             return;
//         }
//         if (startTime >= endTime) {
//             setSpotsInfo(null);
//             return;
//         }
//
//         const toMin = (t: string) => {
//             const parts = t.split(":");
//             return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
//         };
//
//         const sStart = toMin(startTime);
//         const sEnd = toMin(endTime);
//
//         const overlappingSlots = facilityData.slots.filter((slot) => {
//             if (slot.slotDate !== selectedDate) return false;
//             const slotStart = toMin(slot.startTime);
//             const slotEnd = toMin(slot.endTime);
//             return slotStart < sEnd && slotEnd > sStart;
//         });
//
//         if (overlappingSlots.length === 0) {
//             setSpotsInfo({ occupied: 0, available: true });
//             return;
//         }
//
//         const maxOccupied = Math.max(...overlappingSlots.map((s) => s.occupied));
//         setSpotsInfo({
//             occupied: maxOccupied,
//             available: maxOccupied < facilityData.maxPeople,
//         });
//     }, [facilityData, selectedDate, startTime, endTime]);
//
//     const handleSubmit = async () => {
//         if (!facilityData) return;
//
//         if (!selectedDate) {
//             setErrorMsg("Please select a date");
//             return;
//         }
//         if (!startTime || !endTime) {
//             setErrorMsg("Please select start and end time");
//             return;
//         }
//         if (startTime >= endTime) {
//             setErrorMsg("End time must be after start time");
//             return;
//         }
//         if (!activity.trim()) {
//             setErrorMsg("Please describe your intended activity");
//             return;
//         }
//
//         try {
//             setSubmitting(true);
//             setErrorMsg("");
//             const response = await bookingService.submitBookingRequest({
//                 facilityId: facilityData.facilityId,
//                 slotDate: selectedDate,
//                 startTime,
//                 endTime,
//                 intendedActivity: activity.trim(),
//             });
//
//             if (response.status === "ok") {
//                 setSuccessMsg(
//                     "Booking request submitted! Waiting for staff approval."
//                 );
//                 setTimeout(() => navigate("/"), 3000);
//             } else {
//                 setErrorMsg(response.message || "Failed to submit");
//             }
//         } catch (err: any) {
//             setErrorMsg(err?.message || "Failed to submit booking request");
//         } finally {
//             setSubmitting(false);
//         }
//     };
//
//     if (loading) {
//         return (
//             <div className="container py-5 text-center">
//                 <Spinner animation="border" />
//                 <p className="mt-3">Loading facility data...</p>
//             </div>
//         );
//     }
//
//     if (!facilityData) {
//         return (
//             <div className="container py-5">
//                 <Alert variant="danger">{errorMsg || "Facility not found"}</Alert>
//                 <Button variant="secondary" onClick={() => navigate("/")}>
//                     Back to facilities
//                 </Button>
//             </div>
//         );
//     }
//
//     const availableDates = [
//         ...new Set(facilityData.slots.map((s) => s.slotDate)),
//     ].sort();
//
//     // Dynamically infer the opening time range from time slot data
//     const getTimeRange = () => {
//         if (!facilityData || facilityData.slots.length === 0) {
//             return { earliest: "08:00", latest: "22:00" };
//         }
//
//         const relevantSlots = selectedDate
//             ? facilityData.slots.filter((s) => s.slotDate === selectedDate)
//             : facilityData.slots;
//
//         if (relevantSlots.length === 0) {
//             return { earliest: "08:00", latest: "22:00" };
//         }
//
//         const earliest = relevantSlots.reduce(
//             (min, s) => (s.startTime < min ? s.startTime : min),
//             relevantSlots[0].startTime
//         );
//         const latest = relevantSlots.reduce(
//             (max, s) => (s.endTime > max ? s.endTime : max),
//             relevantSlots[0].endTime
//         );
//
//         return { earliest, latest };
//     };
//
//     const { earliest, latest } = getTimeRange();
//
//     const toMin = (t: string) => {
//         const parts = t.split(":");
//         return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
//     };
//
//     const hourOptions: string[] = [];
//     for (let m = toMin(earliest); m <= toMin(latest); m += 60) {
//         const h = Math.floor(m / 60);
//         hourOptions.push(`${String(h).padStart(2, "0")}:00`);
//     }
//
//     const endTimeOptions = hourOptions.filter((t) => t > startTime);
//
//     const canSubmit =
//         selectedDate &&
//         startTime &&
//         endTime &&
//         startTime < endTime &&
//         activity.trim() &&
//         !submitting &&
//         (!spotsInfo || spotsInfo.available);
//
//     return (
//         <div className="container py-4" style={{ maxWidth: "1100px" }}>
//             <Button
//                 variant="link"
//                 className="px-0 mb-3"
//                 onClick={() => navigate("/")}
//             >
//                 ← Back to facilities
//             </Button>
//
//             <h2>Book Facility</h2>
//             <p className="text-muted">Complete your booking request</p>
//
//             {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
//             {successMsg && <Alert variant="success">{successMsg}</Alert>}
//
//             <Row>
//                 <Col lg={8}>
//                     <Card className="mb-4">
//                         <Card.Body>
//                             <Card.Title className="mb-4">Booking Details</Card.Title>
//
//                             <Form.Group className="mb-4">
//                                 <Form.Label>Facility Name</Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     value={facilityData.facilityName}
//                                     disabled
//                                 />
//                             </Form.Group>
//
//                             <Form.Group className="mb-4">
//                                 <Form.Label>Date</Form.Label>
//                                 <Form.Control
//                                     type="date"
//                                     value={selectedDate}
//                                     min={today}
//                                     max={(() => {
//                                         const d = new Date();
//                                         d.setDate(d.getDate() + 29);
//                                         return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
//                                     })()}
//                                     onChange={(e) => {
//                                         setSelectedDate(e.target.value);
//                                         setStartTime("");
//                                         setEndTime("");
//                                     }}
//                                 />
//                             </Form.Group>
//
//                             <Row className="mb-4">
//                                 <Col md={6}>
//                                     <Form.Group>
//                                         <Form.Label>Start Time</Form.Label>
//                                         <Form.Select
//                                             value={startTime}
//                                             onChange={(e) => {
//                                                 setStartTime(e.target.value);
//                                                 setEndTime("");
//                                             }}
//                                             disabled={!selectedDate}
//                                         >
//                                             <option value="">Select start time</option>
//                                             {hourOptions.filter((t) => t < "22:00").map((t) => (
//                                                 <option key={t} value={t}>
//                                                     {t}
//                                                 </option>
//                                             ))}
//                                         </Form.Select>
//                                     </Form.Group>
//                                 </Col>
//                                 <Col md={6}>
//                                     <Form.Group>
//                                         <Form.Label>End Time</Form.Label>
//                                         <Form.Select
//                                             value={endTime}
//                                             onChange={(e) => setEndTime(e.target.value)}
//                                             disabled={!startTime}
//                                         >
//                                             <option value="">Select end time</option>
//                                             {endTimeOptions.map((t) => (
//                                                 <option key={t} value={t}>
//                                                     {t}
//                                                 </option>
//                                             ))}
//                                         </Form.Select>
//                                     </Form.Group>
//                                 </Col>
//                             </Row>
//
//                             <Form.Group className="mb-4">
//                                 <Form.Label>Intended Activity</Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     placeholder="e.g., Recreational badminton, Training session"
//                                     value={activity}
//                                     onChange={(e) => setActivity(e.target.value)}
//                                     maxLength={500}
//                                 />
//                             </Form.Group>
//
//                             <div className="d-flex align-items-center gap-3 mt-4">
//                                 <Button
//                                     variant="primary"
//                                     size="lg"
//                                     onClick={handleSubmit}
//                                     disabled={!canSubmit}
//                                 >
//                                     {submitting ? "Submitting..." : "Submit Booking Request"}
//                                 </Button>
//                                 <Button
//                                     variant="link"
//                                     className="text-muted"
//                                     onClick={() => navigate("/")}
//                                 >
//                                     Back to Facilities
//                                 </Button>
//                             </div>
//                         </Card.Body>
//                     </Card>
//                 </Col>
//
//                 <Col lg={4}>
//                     <Card className="shadow-sm">
//                         <Card.Body>
//                             <Card.Title className="mb-3">Booking Summary</Card.Title>
//
//                             <div className="mb-3">
//                                 <div className="text-muted small">Selected Facility</div>
//                                 <div className="fw-bold">{facilityData.facilityName}</div>
//                             </div>
//
//                             {selectedDate && (
//                                 <div className="mb-3">
//                                     <div className="text-muted small">Date</div>
//                                     <div className="fw-bold">{selectedDate}</div>
//                                 </div>
//                             )}
//
//                             {startTime && endTime && startTime < endTime && (
//                                 <div className="mb-3">
//                                     <div className="text-muted small">Time Slot</div>
//                                     <div className="fw-bold">
//                                         {startTime} – {endTime}
//                                     </div>
//                                 </div>
//                             )}
//
//                             {spotsInfo && startTime && endTime && startTime < endTime && (
//                                 <div className="mb-3">
//                                     {spotsInfo.available ? (
//                                         <Alert variant="success" className="py-2 mb-0">
//                                             <strong>Available</strong>
//                                             <div className="small">
//                                                 {facilityData.maxPeople - spotsInfo.occupied}/
//                                                 {facilityData.maxPeople} spots left · Pending approval
//                                                 from staff
//                                             </div>
//                                         </Alert>
//                                     ) : (
//                                         <Alert variant="danger" className="py-2 mb-0">
//                                             <strong>Full</strong>
//                                             <div className="small">
//                                                 This time slot has no available spots
//                                             </div>
//                                         </Alert>
//                                     )}
//                                 </div>
//                             )}
//
//                             {facilityData.maxPeople && (
//                                 <Alert variant="info" className="py-2 mt-3 mb-0">
//                                     <strong>Usage Guidelines</strong>
//                                     <div className="small">
//                                         Maximum {facilityData.maxPeople} people per slot.
//                                         Please arrive 5 minutes before your booking time.
//                                     </div>
//                                 </Alert>
//                             )}
//                         </Card.Body>
//                     </Card>
//                 </Col>
//             </Row>
//         </div>
//     );
// }

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { bookingService } from "~/services/booking.service";
import type { FacilitySlots, OpeningHour } from "~/services/types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

const minToHHMM = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const formatDuration = (mins: number) => {
    if (mins % 60 === 0) return `${mins / 60} hour${mins / 60 > 1 ? "s" : ""}`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const getDayKey = (dateStr: string) => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    return DAY_KEYS[new Date(y, mo - 1, d).getDay()];
};

export default function NewBooking() {
    const { facilityId } = useParams<{ facilityId: string }>();
    const navigate = useNavigate();

    const [facilityData, setFacilityData] = useState<FacilitySlots | null>(null);
    const [activity, setActivity] = useState("");

    const [selectedDate, setSelectedDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [spotsInfo, setSpotsInfo] = useState<{
        occupied: number;
        available: boolean;
    } | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Load facility info (opening hours + existing bookings + max duration)
    useEffect(() => {
        const load = async () => {
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
                    setErrorMsg(response.message || "Failed to load facility data");
                }
            } catch (err: any) {
                setErrorMsg(err.message || "Failed to load facility data");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [facilityId]);

    // Recompute availability whenever date/time changes
    useEffect(() => {
        if (!facilityData || !selectedDate || !startTime || !endTime) {
            setSpotsInfo(null);
            return;
        }
        if (startTime >= endTime) {
            setSpotsInfo(null);
            return;
        }

        const sStart = toMin(startTime);
        const sEnd = toMin(endTime);

        // Count overlapping existing bookings on the same date
        const overlapping = facilityData.existingBookings.filter((b) => {
            if (b.date !== selectedDate) return false;
            const bStart = toMin(b.startTime);
            const bEnd = toMin(b.endTime);
            return bStart < sEnd && bEnd > sStart;
        });

        const occupied = overlapping.length;
        setSpotsInfo({
            occupied,
            available: occupied < facilityData.maxPeople,
        });
    }, [facilityData, selectedDate, startTime, endTime]);

    const handleSubmit = async () => {
        if (!facilityData) return;

        if (!selectedDate) {
            setErrorMsg("Please select a date");
            return;
        }
        if (!startTime || !endTime) {
            setErrorMsg("Please select start and end time");
            return;
        }
        if (startTime >= endTime) {
            setErrorMsg("End time must be after start time");
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
                slotDate: selectedDate,
                startTime,
                endTime,
                intendedActivity: activity.trim(),
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
            setErrorMsg(err?.message || "Failed to submit booking request");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Loading facility data...</p>
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

    // Opening windows for the selected date (multiple windows per day are supported)
    const windowsForSelectedDate: OpeningHour[] = selectedDate
        ? facilityData.openingHours.filter(
            (oh) => oh.dayOfWeek === getDayKey(selectedDate)
        )
        : [];

    const isClosedOnSelectedDate =
        Boolean(selectedDate) && windowsForSelectedDate.length === 0;

    // Build start-time options: every hour mark inside any opening window
    // (excluding the window's end-time itself, since you can't start at closing time)
    const startTimeOptions: string[] = [];
    {
        const seen = new Set<string>();
        for (const w of windowsForSelectedDate) {
            const wStart = toMin(w.startTime);
            const wEnd = toMin(w.endTime);
            // Round up to the next hour
            const firstHour = Math.ceil(wStart / 60) * 60;
            for (let m = firstHour; m < wEnd; m += 60) {
                const t = minToHHMM(m);
                if (!seen.has(t)) {
                    seen.add(t);
                    startTimeOptions.push(t);
                }
            }
        }
        startTimeOptions.sort();
    }

    // Build end-time options: hours strictly after startTime,
    // bounded by (a) the same opening window's end and
    //          (b) startTime + maxDurationMinutes (if set)
    const endTimeOptions: string[] = [];
    if (startTime) {
        const sMin = toMin(startTime);
        // Find the opening window that contains startTime
        const containingWindow = windowsForSelectedDate.find(
            (w) => toMin(w.startTime) <= sMin && sMin < toMin(w.endTime)
        );
        if (containingWindow) {
            const windowEnd = toMin(containingWindow.endTime);
            const durationCap =
                facilityData.maxDurationMinutes != null
                    ? sMin + facilityData.maxDurationMinutes
                    : Infinity;
            const upperBound = Math.min(windowEnd, durationCap);

            // Hour marks strictly after startTime, up to and including upperBound
            const firstHour = Math.ceil((sMin + 1) / 60) * 60;
            for (let m = firstHour; m <= upperBound; m += 60) {
                endTimeOptions.push(minToHHMM(m));
            }
        }
    }

    const canSubmit =
        selectedDate &&
        !isClosedOnSelectedDate &&
        startTime &&
        endTime &&
        startTime < endTime &&
        activity.trim() &&
        !submitting &&
        (!spotsInfo || spotsInfo.available);

    const dayLabelMap: Record<string, string> = {
        sun: "Sun",
        mon: "Mon",
        tue: "Tue",
        wed: "Wed",
        thu: "Thu",
        fri: "Fri",
        sat: "Sat",
    };

    return (
        <div className="container py-4" style={{ maxWidth: "1100px" }}>
            <Button
                variant="link"
                className="px-0 mb-3"
                onClick={() => navigate("/")}
            >
                ← Back to facilities
            </Button>

            <h2>Book Facility</h2>
            <p className="text-muted">Complete your booking request</p>

            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
            {successMsg && <Alert variant="success">{successMsg}</Alert>}

            <Row>
                <Col lg={8}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title className="mb-4">Booking Details</Card.Title>

                            <Form.Group className="mb-4">
                                <Form.Label>Facility Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={facilityData.facilityName}
                                    disabled
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={selectedDate}
                                    min={today}
                                    max={(() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() + 29);
                                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                    })()}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setStartTime("");
                                        setEndTime("");
                                    }}
                                />
                                {isClosedOnSelectedDate && (
                                    <Form.Text className="text-danger">
                                        This facility is closed on the selected day.
                                    </Form.Text>
                                )}
                            </Form.Group>

                            <Row className="mb-4">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Start Time</Form.Label>
                                        <Form.Select
                                            value={startTime}
                                            onChange={(e) => {
                                                setStartTime(e.target.value);
                                                setEndTime("");
                                            }}
                                            disabled={
                                                !selectedDate ||
                                                isClosedOnSelectedDate ||
                                                startTimeOptions.length === 0
                                            }
                                        >
                                            <option value="">Select start time</option>
                                            {startTimeOptions.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>End Time</Form.Label>
                                        <Form.Select
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            disabled={!startTime || endTimeOptions.length === 0}
                                        >
                                            <option value="">Select end time</option>
                                            {endTimeOptions.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-4">
                                <Form.Label>Intended Activity</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Recreational badminton, Training session"
                                    value={activity}
                                    onChange={(e) => setActivity(e.target.value)}
                                    maxLength={500}
                                />
                            </Form.Group>

                            <div className="d-flex align-items-center gap-3 mt-4">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                >
                                    {submitting ? "Submitting..." : "Submit Booking Request"}
                                </Button>
                                <Button
                                    variant="link"
                                    className="text-muted"
                                    onClick={() => navigate("/")}
                                >
                                    Back to Facilities
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title className="mb-3">Booking Summary</Card.Title>

                            <div className="mb-3">
                                <div className="text-muted small">Selected Facility</div>
                                <div className="fw-bold">{facilityData.facilityName}</div>
                            </div>

                            {selectedDate && (
                                <div className="mb-3">
                                    <div className="text-muted small">Date</div>
                                    <div className="fw-bold">{selectedDate}</div>
                                </div>
                            )}

                            {selectedDate && windowsForSelectedDate.length > 0 && (
                                <div className="mb-3">
                                    <div className="text-muted small">
                                        Opening Hours ({dayLabelMap[getDayKey(selectedDate)]})
                                    </div>
                                    <div className="fw-bold">
                                        {windowsForSelectedDate
                                            .map((w) => `${w.startTime} – ${w.endTime}`)
                                            .join(", ")}
                                    </div>
                                </div>
                            )}

                            {facilityData.maxDurationMinutes != null && (
                                <div className="mb-3">
                                    <div className="text-muted small">Max Duration</div>
                                    <div className="fw-bold">
                                        {formatDuration(facilityData.maxDurationMinutes)}
                                    </div>
                                </div>
                            )}

                            {startTime && endTime && startTime < endTime && (
                                <div className="mb-3">
                                    <div className="text-muted small">Time Slot</div>
                                    <div className="fw-bold">
                                        {startTime} – {endTime}
                                    </div>
                                </div>
                            )}

                            {spotsInfo && startTime && endTime && startTime < endTime && (
                                <div className="mb-3">
                                    {spotsInfo.available ? (
                                        <Alert variant="success" className="py-2 mb-0">
                                            <strong>Available</strong>
                                            <div className="small">
                                                {facilityData.maxPeople - spotsInfo.occupied}/
                                                {facilityData.maxPeople} spots left · Pending approval
                                                from staff
                                            </div>
                                        </Alert>
                                    ) : (
                                        <Alert variant="danger" className="py-2 mb-0">
                                            <strong>Full</strong>
                                            <div className="small">
                                                This time slot has no available spots
                                            </div>
                                        </Alert>
                                    )}
                                </div>
                            )}

                            {facilityData.maxPeople && (
                                <Alert variant="info" className="py-2 mt-3 mb-0">
                                    <strong>Usage Guidelines</strong>
                                    <div className="small">
                                        Maximum {facilityData.maxPeople} people per slot.
                                        Please arrive 5 minutes before your booking time.
                                    </div>
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}