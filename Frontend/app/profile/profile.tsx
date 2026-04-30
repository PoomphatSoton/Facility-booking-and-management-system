import { useState } from "react";
import { Button, Form, Alert, Modal } from "react-bootstrap";
import { useAuth } from "~/auth/auth-middleware";
import "./profile.css";

type ProfileForm = {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    address: string;
};

type PasswordForm = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export default function Profile() {
    const { user } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [form, setForm] = useState<ProfileForm>({
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        dateOfBirth: user?.dateOfBirth ?? "",
        address: user?.address ?? "",
    });

    const [passwordForm, setPasswordForm] = useState<PasswordForm>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const passwordMismatch =
        passwordForm.confirmPassword.length > 0 &&
        passwordForm.newPassword !== passwordForm.confirmPassword;

    const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const setPasswordField = <K extends keyof PasswordForm>(key: K, value: PasswordForm[K]) => {
        setPasswordForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleEdit = () => {
        setIsEditing(true);
        setSuccessMessage("");
        setErrorMessage("");
    };

    const handleCancel = () => {
        setIsEditing(false);
        setForm({
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            dateOfBirth: user?.dateOfBirth ?? "",
            address: user?.address ?? "",
        });
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // TODO: call update profile API
        console.log("Save profile:", form);
        setIsEditing(false);
    };

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
        // TODO: call change password API
        console.log("Change password:", passwordForm);
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    };

    return (
        <main className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div>
                        <h1>My Profile</h1>
                        <p className="profile-email">{user?.email}</p>
                    </div>
                    <span className={`profile-role-badge profile-role-badge--${user?.role}`}>
                        {user?.role}
                    </span>
                </div>

                {successMessage ? (
                    <Alert variant="success" dismissible onClose={() => setSuccessMessage("")}>
                        {successMessage}
                    </Alert>
                ) : null}
                {errorMessage ? (
                    <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>
                        {errorMessage}
                    </Alert>
                ) : null}

                <form onSubmit={handleSave} className="profile-form">
                    <section className="profile-section">
                        <div className="profile-section-header">
                            <h2>Personal Information</h2>
                            {!isEditing ? (
                                <Button variant="outline-primary" size="sm" type="button" onClick={handleEdit}>
                                    Edit
                                </Button>
                            ) : (
                                <div className="profile-action-buttons">
                                    <Button variant="outline-secondary" size="sm" type="button" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" size="sm" type="submit">
                                        Save
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="profile-fields">
                            <div className="profile-field">
                                <label>First Name</label>
                                {isEditing ? (
                                    <Form.Control
                                        type="text"
                                        value={form.firstName}
                                        onChange={(e) => setField("firstName", e.target.value)}
                                        required
                                    />
                                ) : (
                                    <p className="profile-value">{user?.firstName || "—"}</p>
                                )}
                            </div>

                            <div className="profile-field">
                                <label>Last Name</label>
                                {isEditing ? (
                                    <Form.Control
                                        type="text"
                                        value={form.lastName}
                                        onChange={(e) => setField("lastName", e.target.value)}
                                        required
                                    />
                                ) : (
                                    <p className="profile-value">{user?.lastName || "—"}</p>
                                )}
                            </div>

                            <div className="profile-field">
                                <label>Date of Birth</label>
                                {isEditing ? (
                                    <Form.Control
                                        type="date"
                                        value={form.dateOfBirth}
                                        onChange={(e) => setField("dateOfBirth", e.target.value)}
                                    />
                                ) : (
                                    <p className="profile-value">{user?.dateOfBirth || "—"}</p>
                                )}
                            </div>

                            <div className="profile-field profile-field--full">
                                <label>Address</label>
                                {isEditing ? (
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={form.address}
                                        onChange={(e) => setField("address", e.target.value)}
                                    />
                                ) : (
                                    <p className="profile-value">{user?.address || "—"}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="profile-section">
                        <div className="profile-section-header">
                            <h2>Security</h2>
                        </div>
                        <Button
                            variant="outline-warning"
                            type="button"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            Change Password
                        </Button>
                    </section>
                </form>
            </div>

            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Change Password</Modal.Title>
                </Modal.Header>
                <form onSubmit={handleChangePassword}>
                    <Modal.Body className="profile-password-modal">
                        <div className="profile-field">
                            <label htmlFor="current-password">Current Password</label>
                            <Form.Control
                                id="current-password"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordField("currentPassword", e.target.value)}
                                required
                            />
                        </div>
                        <div className="profile-field">
                            <label htmlFor="new-password">New Password</label>
                            <Form.Control
                                id="new-password"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordField("newPassword", e.target.value)}
                                required
                            />
                        </div>
                        <div className="profile-field">
                            <label htmlFor="confirm-password">Confirm New Password</label>
                            <Form.Control
                                id="confirm-password"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordField("confirmPassword", e.target.value)}
                                isInvalid={passwordMismatch}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                Passwords do not match.
                            </Form.Control.Feedback>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" type="button" onClick={() => setShowPasswordModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={passwordMismatch}>
                            Update Password
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </main>
    );
}
