import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import "./facility.css";

type FacilityCardProps = {
    name: string;
    description: string;
    currentOpening: {
        day: string;
        startTime: string;
        endTime: string;
    };
    otherOpenings: Array<{
        day: string;
        startTime: string;
        endTime: string;
    }>;
    slotToday: string[];
    slotByDate: Array<{
        date: string;
        slots: string[];
    }>;
    maxPeople: number;
    usageGuidelines: string[];
    imageUrl: string;
};

const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
};

export default function FacilityCard({
    name,
    description,
    currentOpening,
    otherOpenings,
    slotToday,
    slotByDate,
    maxPeople,
    usageGuidelines,
    imageUrl,
}: FacilityCardProps) {
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [activeDetailType, setActiveDetailType] = useState<"description" | "guidelines">("description");
    const [selectedSlotDate, setSelectedSlotDate] = useState(slotByDate[0]?.date ?? "");

    const visibleSlots = slotToday.slice(0, 3);
    const hiddenSlotsCount = Math.max(slotToday.length - visibleSlots.length, 0);
    const descriptionPreview = truncateText(description, 95);
    const guidelinePreviewText = truncateText(usageGuidelines.join(" • "), 90);
    const selectedDateSlots = slotByDate.find((slotItem) => slotItem.date === selectedSlotDate)?.slots ?? [];
    const hasDescriptionOverflow = description.length > 95;
    const hasGuidelineOverflow = usageGuidelines.join(" • ").length > 90;

    const handleOpenDetailModal = (detailType: "description" | "guidelines") => {
        setActiveDetailType(detailType);
        setIsDetailModalOpen(true);
    };

    return (
        <>
            <Card className="card-container">
                <Card.Img
                    className="facility-card-image"
                    src={imageUrl}
                />
                <Card.Body className="facility-card-body">
                    <Card.Title className="facility-card-title">{name}</Card.Title>
                    <Card.Text className="facility-card-description">
                        {descriptionPreview}
                        {hasDescriptionOverflow ? (
                            <button
                                type="button"
                                className="facility-inline-more-btn"
                                onClick={() => handleOpenDetailModal("description")}
                            >
                                View more
                            </button>
                        ) : null}
                    </Card.Text>
                    <div className="facility-card-meta">
                        <div className="facility-meta-row">
                            <span className="facility-meta-dot" />
                            <span>Availability</span>
                        </div>
                        <div className="facility-meta-value">
                            {currentOpening.day === "—"
                                ? <span style={{ color: "#dc3545", fontWeight: 600 }}>Closed today</span>
                                : `${currentOpening.day} ${currentOpening.startTime}-${currentOpening.endTime}`
                            }
                        </div>
                        <button
                            type="button"
                            className="facility-opening-more-btn"
                            onClick={() => setIsOpeningModalOpen(true)}
                        >
                            View other days
                        </button>
                        <div className="facility-meta-row mt-2">
                            <span className="facility-meta-icon">T</span>
                            <span>Slot today</span>
                        </div>
                        {slotToday.length === 0 ? (
                            <div className="facility-meta-value" style={{ color: "#6c757d" }}>No slot today</div>
                        ) : (
                            <>
                                <div className="facility-slot-list">
                                    {visibleSlots.map((slotTime) => (
                                        <span className="facility-slot-chip" key={slotTime}>
                                            {slotTime}
                                        </span>
                                    ))}
                                    {hiddenSlotsCount > 0 ? (
                                        <span className="facility-slot-chip">...</span>
                                    ) : null}
                                </div>
                                {hiddenSlotsCount > 0 ? (
                                    <button
                                        type="button"
                                        className="facility-opening-more-btn"
                                        onClick={() => setIsSlotModalOpen(true)}
                                    >
                                        View more slots
                                    </button>
                                ) : null}
                            </>
                        )}
                    </div>
                    <div className="facility-card-meta">
                        <div className="facility-meta-row">
                            <span className="facility-meta-icon">#</span>
                            <span>Max people</span>
                        </div>
                        <div className="facility-meta-value">{maxPeople} people</div>
                    </div>
                    <div className="facility-card-meta">
                        <div className="facility-meta-row">
                            <span className="facility-meta-icon">i</span>
                            <span>Usage Guidelines</span>
                        </div>
                        <div className="facility-meta-value">
                            {guidelinePreviewText}
                            {hasGuidelineOverflow ? (
                                <button
                                    type="button"
                                    className="facility-inline-more-btn"
                                    onClick={() => handleOpenDetailModal("guidelines")}
                                >
                                    View more
                                </button>
                            ) : null}
                        </div>
                    </div>
                    <div className="facility-card-actions">
                        <Button variant="primary">Book Now</Button>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={isOpeningModalOpen} onHide={() => setIsOpeningModalOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{name} Opening Days</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul className="facility-guideline-list">
                        {otherOpenings.map((opening, index) => (
                            <li key={`${opening.day}-${opening.startTime}-${index}`}>
                                {`${opening.day} ${opening.startTime}-${opening.endTime}`}
                            </li>
                        ))}
                    </ul>
                </Modal.Body>
            </Modal>

            <Modal show={isSlotModalOpen} onHide={() => setIsSlotModalOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{name} Slot Times</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <label className="form-label" htmlFor={`slot-date-${name}`}>Select date</label>
                    <input
                        id={`slot-date-${name}`}
                        className="form-control"
                        type="date"
                        lang="en-GB"
                        value={selectedSlotDate}
                        onChange={(event) => setSelectedSlotDate(event.target.value)}
                    />

                    <div className="facility-modal-slot-list mt-3">
                        {selectedDateSlots.length > 0 ? (
                            selectedDateSlots.map((slotTime) => (
                                <span className="facility-slot-chip" key={`${selectedSlotDate}-${slotTime}`}>
                                    {slotTime}
                                </span>
                            ))
                        ) : (
                            <p className="mb-0 text-muted">No slot available for selected date.</p>
                        )}
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={isDetailModalOpen} onHide={() => setIsDetailModalOpen(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {activeDetailType === "description" ? `${name} Description` : `${name} Usage Guidelines`}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {activeDetailType === "description" ? (
                        <p className="mb-0">{description}</p>
                    ) : (
                        <ul className="facility-guideline-list">
                            {usageGuidelines.map((guideline) => (
                                <li key={guideline}>{guideline}</li>
                            ))}
                        </ul>
                    )}
                </Modal.Body>
            </Modal>

        </>
    );
}