import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { Button, Form } from "react-bootstrap";
import "./staff-mangament.css";

type StaffFormState = {
    username: string;
    name: string;
    facility: string;
    password: string;
};

type StaffEditState = {
    id: number;
    username: string;
    name: string;
    facility: string;
    status: string;
};

const FACILITIES = [
    "Badminton Court",
    "Football Pitch",
    "Tennis Court",
    "Squash Court",
    "Basketball Court",
    "Swimming Pool",
];

const buildInitialState = (editData: StaffEditState | null): StaffFormState => {
    if (editData) {
        return {
            username: editData.username,
            name: editData.name,
            facility: editData.facility,
            password: "",
        };
    }
    return { username: "", name: "", facility: FACILITIES[0], password: "" };
};

export default function CreateStaff() {
    const navigate = useNavigate();
    const { staffId } = useParams<{ staffId: string }>();
    const location = useLocation();
    const isEdit = Boolean(staffId);
    const editData = (location.state as StaffEditState | null) ?? null;

    const [form, setForm] = useState<StaffFormState>(() => buildInitialState(editData));
    const [confirmPassword, setConfirmPassword] = useState("");
    const passwordMismatch = confirmPassword.length > 0 && form.password !== confirmPassword;

    const setField = <K extends keyof StaffFormState>(key: K, value: StaffFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== confirmPassword) return;
        if (isEdit) {
            // TODO: call update staff API
            console.log("Update staff:", staffId, form);
        } else {
            // TODO: call create staff API
            console.log("Create staff:", form);
        }
        navigate("/admin/staff");
    };

    return (
        <main className="staff-page">
            <div className="create-staff-header">
                <h1>{isEdit ? "Edit Staff" : "Create New Staff"}</h1>
                <Button variant="outline-secondary" onClick={() => navigate("/admin/staff")}>
                    Back
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="create-staff-form">
                <section className="create-staff-section">
                    <h2>Account Information</h2>

                    <div className="create-staff-field">
                        <label htmlFor="cs-username">Username</label>
                        <Form.Control
                            id="cs-username"
                            type="text"
                            placeholder="e.g. john.doe"
                            value={form.username}
                            onChange={(e) => setField("username", e.target.value)}
                            required
                        />
                    </div>

                    <div className="create-staff-field">
                        <label htmlFor="cs-name">Staff Name</label>
                        <Form.Control
                            id="cs-name"
                            type="text"
                            placeholder="e.g. John Doe"
                            value={form.name}
                            onChange={(e) => setField("name", e.target.value)}
                            required
                        />
                    </div>

                    <div className="create-staff-field">
                        <label htmlFor="cs-password">
                            {isEdit ? "New Password (leave blank to keep current)" : "Password"}
                        </label>
                        <Form.Control
                            id="cs-password"
                            type="password"
                            placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
                            value={form.password}
                            onChange={(e) => setField("password", e.target.value)}
                            required={!isEdit}
                        />
                    </div>

                    <div className="create-staff-field">
                        <label htmlFor="cs-confirm-password">Confirm Password</label>
                        <Form.Control
                            id="cs-confirm-password"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            isInvalid={passwordMismatch}
                            required={!isEdit || form.password.length > 0}
                        />
                        <Form.Control.Feedback type="invalid">
                            Passwords do not match.
                        </Form.Control.Feedback>
                    </div>
                </section>

                <section className="create-staff-section">
                    <h2>Assignment</h2>

                    <div className="create-staff-field">
                        <label htmlFor="cs-facility">Facility</label>
                        <Form.Select
                            id="cs-facility"
                            value={form.facility}
                            onChange={(e) => setField("facility", e.target.value)}
                        >
                            {FACILITIES.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </Form.Select>
                    </div>
                </section>

                <div className="create-staff-submit-row">
                    <Button variant="outline-secondary" type="button" onClick={() => navigate("/admin/staff")}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                        {isEdit ? "Save Changes" : "Create Staff"}
                    </Button>
                </div>
            </form>
        </main>
    );
}
