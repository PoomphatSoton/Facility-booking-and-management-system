import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import FacilityCard from "./facility-card";
import "./facility.css";
import "../admin/admin-page.css";
import { Alert, Button, Form } from "react-bootstrap";
import { TIME_RANGES } from "./facility.mock";
import { facilityService } from "~/services/facility.service";
import type { FacilityCardItem } from "~/services/types";

export type Opening = { day: string; startTime: string; endTime: string };

export type FacilityItem = {
    facilityId: number;
    name: string;
    description: string;
    openings: Opening[];
    slotToday: Array<{ start: Date; end: Date }>;
    slotByDate: Array<{ date: string; slots: string[] }>;
    maxPeople: number;
    usageGuidelines: string[];
    imageUrl: string;
    openTime: Date;
    closeTime: Date;
};

const getMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

const timeStrToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

const timeStrToDate = (t: string): Date => {
    const [h, m] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
};

const parseSlot = (s: string): { start: Date; end: Date } => {
    const [startStr, endStr] = s.split("-");
    return { start: timeStrToDate(startStr), end: timeStrToDate(endStr) };
};

const mapCard = (card: FacilityCardItem): FacilityItem => {
    const capitalize = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
    const usageGuidelines = card.usageGuideline
        ? card.usageGuideline.split(/\n|•|;/).map((g) => g.trim()).filter(Boolean)
        : ["No usage guideline available"];

    const allSchedules = card.availableTime
        ? [card.availableTime, ...card.otherAvailableTimes]
        : card.otherAvailableTimes;

    return {
        facilityId: card.facilityId,
        name: card.name,
        description: card.description || "No description available",
        openings: allSchedules.map((t) => ({
            day: capitalize(t.day),
            startTime: t.startTime,
            endTime: t.endTime,
        })),
        slotToday: card.slotToday.map(parseSlot),
        slotByDate: [{ date: card.slotDate, slots: card.slotToday }],
        maxPeople: card.maxPeople,
        usageGuidelines,
        imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
        openTime: card.availableTime ? timeStrToDate(card.availableTime.startTime) : new Date(0),
        closeTime: card.availableTime ? timeStrToDate(card.availableTime.endTime) : new Date(0),
    };
};

export default function FacilityList() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isAdmin = pathname.startsWith("/admin");
    const [facilities, setFacilities] = useState<FacilityItem[]>([]);
    const [showFetchAlert, setShowFetchAlert] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTimeRange, setSelectedTimeRange] = useState("all");
    const [minCapacity, setMinCapacity] = useState(1);
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

    const fetchFacilities = async () => {
        try {
            setShowFetchAlert(false);
            const response = await facilityService.getFacilityCards();
            if (response.status !== "ok") throw new Error(response.message || "Failed to fetch facilities");
            setFacilities(response.data.map(mapCard));
        } catch {
            setShowFetchAlert(true);
            setFacilities([]);
        }
    };

    useEffect(() => { void fetchFacilities(); }, []);

    const filteredFacilities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return facilities.filter((facility) => {
            const matchesCapacity = facility.maxPeople >= minCapacity;
            const matchesTimeWindow = selectedTimeRange === "all" || (() => {
                const range = TIME_RANGES.find((r) => r.id === selectedTimeRange);
                if (!range?.start || !range?.end) return true;
                return getMinutes(facility.openTime) <= timeStrToMinutes(range.start)
                    && getMinutes(facility.closeTime) >= timeStrToMinutes(range.end);
            })();
            const matchesSearch =
                !query ||
                facility.name.toLowerCase().includes(query) ||
                facility.description.toLowerCase().includes(query);
            return matchesSearch && matchesTimeWindow && matchesCapacity;
        });
    }, [facilities, minCapacity, searchQuery, selectedTimeRange]);

    const handleDelete = async (facilityId: number) => {
        const confirmed = window.confirm("Do you want to delete this facility?");
        if (!confirmed) return;
        try {
            await facilityService.deleteFacility(facilityId);
            setFacilities((prev) => prev.filter((f) => f.facilityId !== facilityId));
        } catch (error) {
            console.error(error);
            alert("Failed to delete facility");
        }
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setSelectedTimeRange("all");
        setMinCapacity(1);
    };

    return (
        <main className="facility-page">
            <div className="facility-page-header">
                <div>
                    <h1>Browse Facilities</h1>
                    <p>Find and reserve sports facilities easily</p>
                </div>
                {isAdmin && (
                    <Button variant="primary" onClick={() => navigate("/admin/facility/create")}>
                        Create Facility
                    </Button>
                )}
            </div>

            <div className="facility-toolbar">
                {showFetchAlert ? (
                    <Alert variant="warning" dismissible onClose={() => setShowFetchAlert(false)} className="mb-0">
                        Unable to load latest facility data.
                    </Alert>
                ) : null}
                <div className="facility-filter-row">
                    <input
                        className="facility-search"
                        placeholder="Search facilities"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button variant="primary" onClick={() => setIsAdvancedFiltersOpen((open) => !open)}>
                        {isAdvancedFiltersOpen ? "Hide filters" : "More filters"}
                    </Button>
                </div>

                {isAdvancedFiltersOpen ? (
                    <div className="facility-advanced-filters">
                        <div className="facility-filter-field">
                            <label htmlFor="facility-time-range">Time range</label>
                            <Form.Select
                                id="facility-time-range"
                                value={selectedTimeRange}
                                onChange={(e) => setSelectedTimeRange(e.target.value)}
                            >
                                {TIME_RANGES.map((range) => (
                                    <option key={range.id} value={range.id}>{range.label}</option>
                                ))}
                            </Form.Select>
                        </div>

                        <div className="facility-filter-field">
                            <label htmlFor="facility-capacity">Min max-people</label>
                            <Form.Select
                                id="facility-capacity"
                                value={minCapacity}
                                onChange={(e) => setMinCapacity(Number(e.target.value))}
                            >
                                <option value={1}>Any capacity</option>
                                <option value={4}>4+ people</option>
                                <option value={8}>8+ people</option>
                                <option value={12}>12+ people</option>
                                <option value={16}>16+ people</option>
                            </Form.Select>
                        </div>

                        <Button variant="outline-primary" type="button" onClick={handleResetFilters}>
                            Reset filters
                        </Button>
                    </div>
                ) : null}
            </div>

            <div className="facility-list-container">
                {filteredFacilities.map((facility) => (
                    isAdmin ? (
                        <div key={facility.facilityId} className="admin-card-wrapper">
                            <FacilityCard
                                facilityId={facility.facilityId}
                                name={facility.name}
                                description={facility.description}
                                openings={facility.openings}
                                slotToday={facility.slotToday}
                                slotByDate={facility.slotByDate}
                                maxPeople={facility.maxPeople}
                                usageGuidelines={facility.usageGuidelines}
                                imageUrl={facility.imageUrl}
                            />
                            <div className="admin-card-actions">
                                <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => navigate(`/admin/facility/edit/${facility.facilityId}`, { state: facility })}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(facility.facilityId)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <FacilityCard
                            key={facility.facilityId}
                            facilityId={facility.facilityId}
                            name={facility.name}
                            description={facility.description}
                            openings={facility.openings}
                            slotToday={facility.slotToday}
                            slotByDate={facility.slotByDate}
                            maxPeople={facility.maxPeople}
                            usageGuidelines={facility.usageGuidelines}
                            imageUrl={facility.imageUrl}
                        />
                    )
                ))}
            </div>

            {filteredFacilities.length === 0 ? (
                <p className="facility-empty-state">No facilities matched your filters.</p>
            ) : null}
        </main>
    );
}
