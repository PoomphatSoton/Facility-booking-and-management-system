import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Button, Form } from "react-bootstrap";
import type { FacilityAdminItem } from "./admin-page";
import SlotTimeFacility, { type SlotTime } from "./slot-time-facility";
import OpeningHoursFacility, { type Opening } from "./open-hours-facility";
import { facilityService, type FacilityPayload } from "~/services/facility.service";
import "./create-facility.css";

const fmtDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const fmtTime = (d: Date): string =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

type FacilityFormState = {
    name: string;
    description: string;
    maxPeople: number;
    usageGuidelines: string;
    openings: Opening[];
};

const init = (editData: FacilityAdminItem | null): FacilityFormState => {
    if (editData) {
        return {
            name: editData.name,
            description: editData.description,
            maxPeople: editData.maxPeople,
            usageGuidelines: editData.usageGuidelines.join("\n"),

            openings: editData.openings ?? []
        };
    }

    return {
        name: "",
        description: "",
        maxPeople: 1,
        usageGuidelines: "",
        openings: []
    };
};

export default function CreateFacility() {

    const navigate = useNavigate();
    const { facilityId } = useParams<{ facilityId: string }>();
    const location = useLocation();
    const isEdit = Boolean(facilityId);
    const editData = (location.state as FacilityAdminItem | null) ?? null;
    const [form, setForm] = useState<FacilityFormState>(() => init(editData));
    const [slotTimes, setSlotTimes] = useState<SlotTime[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(editData?.imageUrl ?? "");

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    type DayOfWeek = FacilityPayload["schedules"][number]["dayOfWeek"];

    const dayToApi = (day: string): DayOfWeek => {
        return day.toLowerCase() as DayOfWeek;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: form.name,
            description: form.description,
            usageGuideline: form.usageGuidelines,
            maxPeople: form.maxPeople,
            schedules: form.openings.map((o) => ({
                dayOfWeek: dayToApi(o.day),
                startTime: o.startTime,
                endTime: o.endTime
            })),
            slotTimes: slotTimes.map((s) => ({
                slotDate: fmtDate(s.slotDate),
                startTime: fmtTime(s.startTime),
                endTime: fmtTime(s.endTime),
            }))
        };

        try {
            if (isEdit && facilityId) {
                await facilityService.updateFacility(Number(facilityId), payload);
            } else {
                await facilityService.createFacility(payload);
            }

            navigate("/admin");
        } catch {
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
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                            onChange={(e) => setForm({ ...form, maxPeople: Number(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="create-facility-field">
                        <label htmlFor="cf-image">Facility Image</label>
                        {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="create-facility-image-preview" />
                        )}
                        <Form.Control id="cf-image" type="file" accept="image/*" onChange={handleImageChange} />
                    </div>

                    <div className="create-facility-field">
                        <label htmlFor="cf-guidelines">Usage Guidelines</label>
                        <Form.Control
                            id="cf-guidelines"
                            as="textarea"
                            rows={4}
                            placeholder="e.g. Indoor shoes only"
                            value={form.usageGuidelines}
                            onChange={(e) => setForm({ ...form, usageGuidelines: e.target.value })}
                        />
                    </div>
                </section>

                <OpeningHoursFacility
                    openings={form.openings}
                    onChange={(openings) => setForm({ ...form, openings })}
                />

                <SlotTimeFacility slots={slotTimes} onChange={setSlotTimes} />

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