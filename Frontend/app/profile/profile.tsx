import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { useAuth } from "~/auth/auth-middleware";
import { profileService } from "~/services/profile.service";
import type { ApiError } from "~/services/types";
import profileIcon from "~/image/profile.png";
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
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
        address: user.address ?? "",
      });
    }
  }, [user]);

  const passwordMismatch =
    passwordForm.confirmPassword.length > 0 &&
    passwordForm.newPassword !== passwordForm.confirmPassword;

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setSuccessMessage("");
    setErrorMessage("");
    setIsEditing(true);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    try {
      const { user: updated } = await profileService.updateProfile(form);
      setForm({
        firstName: updated.firstName,
        lastName: updated.lastName,
        dateOfBirth: updated.dateOfBirth,
        address: updated.address,
      });
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setErrorMessage(
        (error as ApiError).message || "Failed to update profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
    setIsChangingPassword(true);
    setPasswordError("");
    try {
      await profileService.updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccessMessage("Password changed successfully.");
    } catch (error) {
      setPasswordError(
        (error as ApiError).message || "Failed to change password.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        <aside className="profile-sidebar">
          <div className="profile-avatar-wrap">
            <img src={profileIcon} alt="avatar" className="profile-avatar" />
          </div>
          <p className="profile-sidebar-name">
            {user?.firstName || "—"} {user?.lastName || ""}
          </p>
          <p className="profile-sidebar-email">{user?.email}</p>
          <span
            className={`profile-role-badge profile-role-badge--${user?.role}`}
          >
            {user?.role}
          </span>

          <hr className="profile-sidebar-divider" />

          <Button
            variant="outline-warning"
            className="w-100"
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </Button>
        </aside>

        <main className="profile-main">
          {successMessage && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccessMessage("")}
              className="mb-3"
            >
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setErrorMessage("")}
              className="mb-3"
            >
              {errorMessage}
            </Alert>
          )}

          <div className="profile-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">Personal Information</h2>
              {!isEditing ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              ) : (
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    form="profile-form"
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Form
              id="profile-form"
              onSubmit={handleSave}
              className="profile-fields-grid"
            >
              <div className="profile-field">
                <label className="profile-label">First Name</label>
                {isEditing ? (
                  <Form.Control
                    value={form.firstName}
                    onChange={handleProfileChange}
                    name="firstName"
                    required
                  />
                ) : (
                  <p className="profile-value">{form.firstName || "—"}</p>
                )}
              </div>

              <div className="profile-field">
                <label className="profile-label">Last Name</label>
                {isEditing ? (
                  <Form.Control
                    value={form.lastName}
                    onChange={handleProfileChange}
                    name="lastName"
                    required
                  />
                ) : (
                  <p className="profile-value">{form.lastName || "—"}</p>
                )}
              </div>

              <div className="profile-field">
                <label className="profile-label">Date of Birth</label>
                {isEditing ? (
                  <Form.Control
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleProfileChange}
                    name="dateOfBirth"
                    max={new Date().toISOString().split("T")[0]}
                  />
                ) : (
                  <p className="profile-value">{form.dateOfBirth || "—"}</p>
                )}
              </div>

              <div className="profile-field">
                <label className="profile-label">Email</label>
                <p className="profile-value profile-value--muted">
                  {user?.email}
                </p>
              </div>

              <div className="profile-field profile-field--full">
                <label className="profile-label">Address</label>
                {isEditing ? (
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.address}
                    onChange={handleProfileChange}
                    name="address"
                  />
                ) : (
                  <p className="profile-value">{form.address || "—"}</p>
                )}
              </div>
            </Form>
          </div>
        </main>
      </div>

      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleChangePassword}>
          <Modal.Body className="d-flex flex-column gap-3">
            {passwordError && <Alert variant="danger">{passwordError}</Alert>}
            <Form.Group>
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                name="currentPassword"
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                isInvalid={passwordMismatch}
                required
              />
              <Form.Control.Feedback type="invalid">
                Passwords do not match.
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={passwordMismatch || isChangingPassword}
            >
              {isChangingPassword ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Update Password"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
