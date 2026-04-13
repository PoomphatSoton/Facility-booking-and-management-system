import { useEffect, useMemo, useState } from "react";
import FacilityCard from "./facility-card";
import "./facility.css";
import { Alert, Button, Form } from "react-bootstrap";
import { TIME_RANGES } from "./facility.mock";
import { facilityService } from "~/services/facility.service";
import type { FacilityCardItem } from "~/services/types";

type FacilityUiItem = {
    name: string;
    category: string;
    description: string;
    currentOpening: { day: string; startTime: string; endTime: string };
    otherOpenings: Array<{ day: string; startTime: string; endTime: string }>;
    slotToday: string[];
    slotByDate: Array<{ date: string; slots: string[] }>;
    maxPeople: number;
    usageGuidelines: string[];
    imageUrl: string;
    openTime: string;
    closeTime: string;
};

const toMinutes = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
};

export default function FacilityList() {
    const [facilities, setFacilities] = useState<FacilityUiItem[]>([]);
    const [showFetchAlert, setShowFetchAlert] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedTimeRange, setSelectedTimeRange] = useState("all");
    const [minCapacity, setMinCapacity] = useState(1);
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

    const mapFacilityCardToUiItem = (card: FacilityCardItem): FacilityUiItem => {
        const capitalize = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

        const usageGuidelines = card.usageGuideline
            ? card.usageGuideline
                .split(/\n|•|;/)
                .map((item) => item.trim())
                .filter(Boolean)
            : ["No usage guideline available"];

        return {
            name: card.name,
            category: "Other",
            description: card.description || "No description available",
            currentOpening: card.availableTime
                ? {
                    day: capitalize(card.availableTime.day),
                    startTime: card.availableTime.startTime,
                    endTime: card.availableTime.endTime,
                }
                : { day: "—", startTime: "—", endTime: "—" },
            otherOpenings: card.otherAvailableTimes.map((t) => ({
                day: capitalize(t.day),
                startTime: t.startTime,
                endTime: t.endTime,
            })),
            slotToday: card.slotToday,
            slotByDate: [{ date: card.slotDate, slots: card.slotToday }],
            maxPeople: card.maxPeople,
            usageGuidelines,
            imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
            openTime: card.availableTime?.startTime ?? "00:00",
            closeTime: card.availableTime?.endTime ?? "00:00",
        };
    };

    const fetchFacilityCards = async () => {
        try {
            setShowFetchAlert(false);
            const response = await facilityService.getFacilityCards();
            console.log("Facility cards response:", response);
            if (response.status !== "ok") {
                throw new Error(response.message || "Failed to fetch facilities");
            }

            setFacilities(response.data.map(mapFacilityCardToUiItem));
        } catch {
            setShowFetchAlert(true);
            setFacilities([]);
        }
    };

    useEffect(() => {
        void fetchFacilityCards();
    }, []);

    const categories = useMemo(
        () => ["All", ...new Set(facilities.map((facility) => facility.category))],
        [facilities],
    );

    const filteredFacilities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return facilities.filter((facility) => {
            const facilityOpenInMinutes = toMinutes(facility.openTime);
            const facilityCloseInMinutes = toMinutes(facility.closeTime);
            const matchesCategory = selectedCategory === "All" || facility.category === selectedCategory;
            const matchesCapacity = facility.maxPeople >= minCapacity;
            const matchesTimeWindow =
                selectedTimeRange === "all" ||
                (() => {
                    const selectedRange = TIME_RANGES.find((range) => range.id === selectedTimeRange);
                    if (!selectedRange || !selectedRange.start || !selectedRange.end) return true;

                    const rangeStartInMinutes = toMinutes(selectedRange.start);
                    const rangeEndInMinutes = toMinutes(selectedRange.end);

                    return facilityOpenInMinutes <= rangeStartInMinutes && facilityCloseInMinutes >= rangeEndInMinutes;
                })();
            const matchesSearch =
                !query ||
                facility.name.toLowerCase().includes(query) ||
                facility.description.toLowerCase().includes(query) ||
                facility.category.toLowerCase().includes(query);

            return matchesCategory && matchesSearch && matchesTimeWindow && matchesCapacity;
        });
    }, [facilities, minCapacity, searchQuery, selectedCategory, selectedTimeRange]);

    const handleResetFilters = () => {
        setSearchQuery("");
        setSelectedCategory("All");
        setSelectedTimeRange("all");
        setMinCapacity(1);
    };

    return (
        <main className="facility-page">
            <div className="facility-page-header">
                <h1>Browse Facilities</h1>
                <p>Find and reserve sports facilities easily</p>
            </div>

            <div className="facility-toolbar">
                {showFetchAlert ? (
                    <Alert variant="warning" dismissible onClose={() => setShowFetchAlert(false)} className="mb-0">
                        Unable to load latest facility data. Showing mock data.
                    </Alert>
                ) : null}
                <div className="facility-filter-row">
                    <input
                        className="facility-search"
                        placeholder="Search facilities"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />

                    <Form.Select
                        value={selectedCategory}
                        onChange={(event) => setSelectedCategory(event.target.value)}
                        aria-label="Category selector"
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </Form.Select>

                    <Button
                        variant="primary"
                        onClick={() => setIsAdvancedFiltersOpen((isOpen) => !isOpen)}
                    >
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
                                onChange={(event) => setSelectedTimeRange(event.target.value)}
                            >
                                {TIME_RANGES.map((range) => (
                                    <option key={range.id} value={range.id}>
                                        {range.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>

                        <div className="facility-filter-field">
                            <label htmlFor="facility-capacity">Min max-people</label>
                            <Form.Select
                                id="facility-capacity"
                                value={minCapacity}
                                onChange={(event) => setMinCapacity(Number(event.target.value))}
                            >
                                <option value={1}>Any capacity</option>
                                <option value={4}>4+ people</option>
                                <option value={8}>8+ people</option>
                                <option value={12}>12+ people</option>
                                <option value={16}>16+ people</option>
                            </Form.Select>
                        </div>

                        <Button variant="outline-primary" onClick={handleResetFilters} type="button">
                            Reset filters
                        </Button>
                    </div>
                ) : null}
            </div>

            <div className="facility-list-container">
                {filteredFacilities.map((facility) => (
                    <FacilityCard
                        key={facility.name}
                        name={facility.name}
                        description={facility.description}
                        currentOpening={facility.currentOpening}
                        otherOpenings={facility.otherOpenings}
                        slotToday={facility.slotToday}
                        slotByDate={facility.slotByDate}
                        maxPeople={facility.maxPeople}
                        usageGuidelines={facility.usageGuidelines}
                        imageUrl={facility.imageUrl}
                    />
                ))}
            </div>

            {filteredFacilities.length === 0 ? (
                <p className="facility-empty-state">No facilities matched your filters.</p>
            ) : null}
        </main>
    );
}