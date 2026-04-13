import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import "./auth.css";
import { authService } from "~/services/auth.service";
import { APP_BRAND_NAME, APP_BRAND_SUBTITLE, APP_BRAND_TAGLINE } from "~/constants/app.constants";
import type { ApiError } from "~/services/types";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetRequestId, setResetRequestId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const prepareSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleApiError = (error: unknown) => {
    const apiError = error as ApiError;
    setErrorMessage(apiError.message || "Something went wrong");
  };

  const submitLabel = {
    email: "Send OTP",
    otp: "Verify OTP",
    reset: "Reset Password",
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    prepareSubmit(e);
    setIsSubmitting(true);
    try {
      const result = await authService.forgotPasswordRequest({ email });
      setResetRequestId(result.resetRequestId);
      if (result.message) setInfoMessage(result.message);
      setStep("otp");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    prepareSubmit(e);
    setIsSubmitting(true);
    try {
      const result = await authService.forgotPasswordVerify({ resetRequestId, otp });
      setResetToken(result.resetToken);
      if (result.message) setInfoMessage(result.message);
      setStep("reset");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    prepareSubmit(e);
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.forgotPasswordReset({ resetToken, newPassword });
      if (result.message) setInfoMessage(result.message);
      setStep("done");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage("");
    setInfoMessage("");
    try {
      const result = await authService.forgotPasswordResendOtp({ resetRequestId });
      setOtp("");
      if (result.message) setInfoMessage(result.message);
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-side">
          <div>
            <h1>{APP_BRAND_NAME}</h1>
            <p>{APP_BRAND_SUBTITLE}</p>
          </div>
          <p>{APP_BRAND_TAGLINE}</p>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form">
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {infoMessage && <Alert variant="info">{infoMessage}</Alert>}

            {step === "email" && (
              <>
                <h2>Forgot Password</h2>
                <p>Enter your email and we'll send you an OTP to reset your password.</p>
                <Form onSubmit={handleEmailSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" size="lg" type="submit" className="w-100 mb-3" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner animation="border" size="sm" /> : submitLabel.email}
                  </Button>
                </Form>
                <p className="auth-footer">
                  Remember your password? <Link to="/auth/login" className="text-primary">Log in</Link>
                </p>
              </>
            )}

            {step === "otp" && (
              <>
                <h2>Enter OTP</h2>
                <p>We sent a 6-digit code to <strong>{email}</strong></p>
                <Form onSubmit={handleOtpSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>OTP Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" size="lg" type="submit" className="w-100 mb-3" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner animation="border" size="sm" /> : submitLabel.otp}
                  </Button>
                </Form>
                <p className="auth-footer">
                  Didn't receive it?{" "}
                  <button type="button" className="btn btn-link p-0 text-primary fw-semibold" onClick={handleResendOtp}>
                    Resend OTP
                  </button>
                </p>
              </>
            )}

            {step === "reset" && (
              <>
                <h2>Reset Password</h2>
                <p>Enter your new password below.</p>
                <Form onSubmit={handleResetSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" size="lg" type="submit" className="w-100 mb-3" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner animation="border" size="sm" /> : submitLabel.reset}
                  </Button>
                </Form>
              </>
            )}

            {step === "done" && (
              <>
                <h2>Password Reset!</h2>
                <p>Your password has been successfully reset.</p>
                <Link to="/auth/login">
                  <Button variant="primary" size="lg" className="w-100">
                    Back to Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
