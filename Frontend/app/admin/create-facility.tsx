import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { Button, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { FacilityAdminItem } from "./admin-page";
import "./create-facility.css";
import { facilityService, type UpdateFacilityPayload } from "~/services/facility.service";

const timeStrToDate = (t: string): Date => {
    const [h, m] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
};

const dateToTimeStr = (d: Date): string =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Opening = { day: string; startTime: string; endTime: string };

type FacilityFormState = {
    name: string;
    description: string;
    maxPeople: number;
    usageGuidelines: string;
    openings: Opening[];
};

const init = (editData: FacilityAdminItem | null): FacilityFormState => {
    if (editData) {
        const validOpenings = [editData.currentOpening, ...editData.otherOpenings].filter(
            (o) => o.day !== "—",
        );
        return {
            name: editData.name,
            description: editData.description,
            maxPeople: editData.maxPeople,
            usageGuidelines: editData.usageGuidelines.join("\n"),
            openings: validOpenings.length > 0
                ? validOpenings
                : [{ day: "Mon", startTime: "09:00", endTime: "17:00" }],
        };
    }
    return {
        name: "",
        description: "",
        maxPeople: 1,
        usageGuidelines: "",
        openings: [{ day: "Mon", startTime: "09:00", endTime: "17:00" }],
    };
};

export default function CreateFacility() {
    const navigate = useNavigate();
    const { facilityId } = useParams<{ facilityId: string }>();
    const location = useLocation();
    const isEdit = Boolean(facilityId);
    const editData = (location.state as FacilityAdminItem | null) ?? null;

    const [form, setForm] = useState<FacilityFormState>(() => init(editData));
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(editData?.imageUrl ?? "");

    const setField = <K extends keyof FacilityFormState>(key: K, value: FacilityFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleAddOpening = () => {
        setForm((prev) => ({
            ...prev,
            openings: [...prev.openings, { day: "Mon", startTime: "09:00", endTime: "17:00" }],
        }));
    };

    const handleRemoveOpening = (index: number) => {
        setForm((prev) => ({
            ...prev,
            openings: prev.openings.filter((_, i) => i !== index),
        }));
    };

    const handleOpeningChange = (index: number, field: keyof Opening, value: string) => {
        setForm((prev) => ({
            ...prev,
            openings: prev.openings.map((opening, i) =>
                i === index ? { ...opening, [field]: value } : opening,
            ),
        }));
    };

    type DayOfWeek = UpdateFacilityPayload["schedules"][number]["dayOfWeek"];

    const dayToApi = (day: string): DayOfWeek => {
        const map: Record<string, DayOfWeek> = {
            Mon: "mon",
            Tue: "tue",
            Wed: "wed",
            Thu: "thu",
            Fri: "fri",
            Sat: "sat",
            Sun: "sun",
        };

        return map[day];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: form.name,
            description: form.description,
            usageGuideline: form.usageGuidelines,
            maxPeople: form.maxPeople,
            schedules: form.openings.map((opening) => ({
                dayOfWeek: dayToApi(opening.day),
                startTime: opening.startTime,
                endTime: opening.endTime,
            })),
            slotTimes: [],
        };

        try {
            if (isEdit && facilityId) {
                await facilityService.updateFacility(Number(facilityId), payload);
            } else {
                console.log("Create facility:", payload, imageFile);
            }

            navigate("/admin");
        } catch (error) {
            console.error(error);
            alert("Failed to save facility");
        }
    };

    return (
        <main className="create-facility-page">
            <div className="create-facility-header">
                <h1>{isEdit ? "Edit Facility" : "Create Facility"}</h1>
                <Button variant="outline-secondary" onClick={() => navigate("/admin")}>
                    Back
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="create-facility-form">
                <section className="create-facility-section">
                    <h2>Basic Information</h2>

                    <div className="create-facility-field">
                        <label htmlFor="cf-name">Name</label>
                        <Form.Control
                            id="cf-name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setField("name", e.target.value)}
                            required
                        />
                    </div>

                    <div className="create-facility-field">
                        <label htmlFor="cf-description">Description</label>
                        <Form.Control
                            id="cf-description"
                            as="textarea"
                            rows={4}
                            value={form.description}
                            onChange={(e) => setField("description", e.target.value)}
                        />
                    </div>
                </section>

                <section className="create-facility-section">
                    <h2>Details</h2>

                    <div className="create-facility-field">
                        <label htmlFor="cf-max-people">Max People</label>
                        <Form.Control
                            id="cf-max-people"
                            type="number"
                            min={1}
                            value={form.maxPeople}
                            onChange={(e) => setField("maxPeople", Number(e.target.value))}
                            required
                        />
                    </div>

                    <div className="create-facility-field">
                        <label htmlFor="cf-image">Facility Image</label>
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="create-facility-image-preview"
                            />
                        ) : null}
                        <Form.Control
                            id="cf-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className="create-facility-field">
                        <label htmlFor="cf-guidelines">Usage Guidelines (one per line)</label>
                        <Form.Control
                            id="cf-guidelines"
                            as="textarea"
                            rows={4}
                            placeholder="e.g. Indoor shoes only"
                            value={form.usageGuidelines}
                            onChange={(e) => setField("usageGuidelines", e.target.value)}
                        />
                    </div>
                </section>

                <section className="create-facility-section">
                    <div className="create-facility-section-header">
                        <h2>Opening Hours</h2>
                        <Button type="button" variant="outline-primary" size="sm" onClick={handleAddOpening}>
                            + Add Day
                        </Button>
                    </div>

                    {form.openings.map((opening, index) => (
                        <div key={index} className="create-facility-opening-row">
                            <Form.Select
                                className="create-facility-opening-day"
                                value={opening.day}
                                onChange={(e) => handleOpeningChange(index, "day", e.target.value)}
                            >
                                {DAYS_OF_WEEK.map((d) => <option key={d} value={d}>{d}</option>)}
                            </Form.Select>
                            <DatePicker
                                selected={timeStrToDate(opening.startTime)}
                                onChange={(date) => date && handleOpeningChange(index, "startTime", dateToTimeStr(date))}
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={30}
                                timeFormat="HH:mm"
                                dateFormat="HH:mm"
                                className="form-control create-facility-time-picker"
                            />
                            <span>to</span>
                            <DatePicker
                                selected={timeStrToDate(opening.endTime)}
                                onChange={(date) => date && handleOpeningChange(index, "endTime", dateToTimeStr(date))}
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={30}
                                timeFormat="HH:mm"
                                dateFormat="HH:mm"
                                className="form-control create-facility-time-picker"
                            />
                            {form.openings.length > 1 ? (
                                <Button
                                    type="button"
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRemoveOpening(index)}
                                >
                                    Remove
                                </Button>
                            ) : null}
                        </div>
                    ))}
                </section>

                <div className="create-facility-submit-row">
                    <Button variant="outline-secondary" type="button" onClick={() => navigate("/admin")}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                        {isEdit ? "Save Changes" : "Create Facility"}
                    </Button>
                </div>
            </form>
        </main>
    );
}
